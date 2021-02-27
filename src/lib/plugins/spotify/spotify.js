import React from 'react'
import Component from 'hyper/component'
import { osInfo } from 'systeminformation'
import util from 'util'
import cp from 'child_process'
import spotify from 'spotify-node-applescript'
import SvgIcon from '../../utils/svg-icon'
import {
  getCurrentlyPlaying,
  getDevices,
  getIsTrackSaved,
  next,
  pause,
  play,
  previous,
  seek,
  setVolume
} from './spotify-api';

export default class Spotify extends Component {
  static displayName() {
    return 'spotify'
  }

  constructor(props) {
    super(props)

    this.isRunning = false
    this.state = {
      version: 'Not running',
      loaded: false,
      showMiniPlayer: false
    }
    this.options = Object.assign({}, this.getDefaultOptions(), this.props.options)

    this.setStatus = this.setStatus.bind(this)
    this.onPlay = this.onPlay.bind(this)
    this.onPause = this.onPause.bind(this)
  }

  componentDidMount() {
    this.update()
    this.interval = setInterval(() => this.update(), 1000)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  getDefaultOptions() {
    return { miniPlayer: true }
  }

  update() {
    this.setStatus()
    this.setVolume()
  }

  setStatus() {
    getCurrentlyPlaying()
      .then((data) => {
        const item = data.item
        const album = item.album
        this.setState({
          loaded: true,
          isPlaying: data.is_playing,
          track: item.name,
          trackId: item.id,
          duration: item.duration_ms,
          progress: data.progress_ms,
          artist: album.artists[0].name,
          album: album.name,
          image: album.images[1].url
        })

        return getIsTrackSaved(item.id)
      })
      .then((trackSaved) => {
        this.setState({ trackSaved })
      })
      .catch((err) => console.log(err))
  }

  setVolume() {
    getDevices()
      .then((data) => {
        const device = data.devices.find((dev) => dev.type === 'Computer')
        this.setState({ volumePercent: device.volume_percent })
      })
  }

  getLibraryAlbums() {
    return fetch('https://api.spotify.com/v1/me/albums', {
      method: 'GET',
      headers: this.getHeaders()
    }).then((res) => res.json())
      .then((data) => {
        const device = data.devices.find((dev) => dev.type === 'Computer')
        this.setState({ volumePercent: device.volume_percent })
      })
      .catch((err) => console.log(err))
  }

  saveTrack(id) {
    fetch(`https://api.spotify.com/v1/me/tracks?ids=${id}`, {
      method: 'PUT',
      headers: this.getHeaders()
    })
      .then(() => {
        this.setState({ trackSaved: true })
      })
      .catch((err) => console.log(err))
  }

  deleteTrack(id) {
    fetch(`https://api.spotify.com/v1/me/tracks?ids=${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
      .then(() => {
        this.setState({ trackSaved: false })
      })
      .catch((err) => console.log(err))
  }

  onPlay() {
    play()
      .then(() => {
        this.setState({ trackSaved: false })
      })
  }

  onPause() {
    pause()
      .then(() => {
        this.setState({ isPlaying: false })
      })
  }

  onMouseDown(ev) {
    if (ev.button === 0) {
      // this.openSpotify()
    } else if (ev.button === 1 && this.options.miniPlayer) {
      this.setState((state) => ({ showMiniPlayer: !state.showMiniPlayer }))
    }
  }

  onWheel(ev) {
    const d = -Math.floor(ev.deltaY/10)
    this.setState((state) => ({
      volumePercent: Math.min(Math.max(0, state.volumePercent + d), 100)
    }), () => {
      setVolume(this.state.volumePercent)
    })
  }

  onTimelineClick(ev) {
    if (!this.timelineRef) return
    const { duration } = this.state
    const { x, width } = this.timelineRef.getBoundingClientRect()
    const position = (ev.clientX - x) / width * duration

    seek(Math.floor(position))
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000)
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  render() {
    if (!this.state.loaded) return null;

    const { showMiniPlayer, isPlaying, track, artist, image, progress, duration, volumePercent, trackSaved, trackId } = this.state
    const volumeLines = Math.floor((volumePercent+15)/20)

    return (
      <div className='wrapper'
           onMouseDown={(ev) => this.onMouseDown(ev)}
           onWheel={(ev) => this.onWheel(ev)}>
        <PluginIcon />
        <span className="play-status">
          {isPlaying ? '▶' : '❚❚'} {artist} — {track}
        </span>
        <div className="volume-level">
          {new Array(5).fill(0).map((_, index) => (
            <div className="volume-line"
                 style={{ height: `${2 + index*2}px`, opacity: index+1 <= volumeLines ? 1 : 0 }} />
          ))}
        </div>
        {showMiniPlayer ? (
          <div className="popup" onMouseDown={(ev) => ev.stopPropagation()}>
            <div className="album-cover" style={{ backgroundImage: `url(${image})` }} />
            <div className="top-row">
              <div className="titles">
                <div className="titles-track">
                  <FloatingText text={track} />
                </div>
                <div className="titles-artist">
                  <FloatingText text={artist} />
                </div>
              </div>
              {trackSaved ? (
                <div className="control heart-button save-track" onClick={() => this.deleteTrack(trackId)}>♥</div>
              ) : (
                <div className="control heart-button delete-track" onClick={() => this.saveTrack(trackId)}>♡</div>
              )}
            </div>
            <div className="timeline" ref={(ref) => this.timelineRef = ref} onClick={(ev) => this.onTimelineClick(ev)}>
              <div className="timeline-progress" style={{ width: `${progress/duration*100}%` }} />
            </div>
            <div className="time">
              <div className="time-progress">
                {this.formatTime(progress)}
              </div>
              <div className="time-duration">
                {this.formatTime(duration)}
              </div>
            </div>
            <div className="controls">
              <span className="control previous" onClick={previous}>⇤</span>
              {isPlaying ? (
                <span className="control pause" onClick={this.onPause}>❚❚</span>
              ) : (
                <span className="control play" onClick={this.onPlay}>▶</span>
              )}
              <span className="control next" onClick={next}>⇥</span>
            </div>
          </div>
        ) : null}

        <style jsx>{`
          .wrapper {
            display: flex;
            align-items: center;
            margin-left: auto;
            color: #1ED760;
          }
          .play-status {
            color: white;
          }
          .popup {
            position: absolute;
            bottom: 24px;
            width: 200px;
            padding: 6px;
            border: 1px solid #1ED760;
            background: rgba(0,0,0,.75);
            box-sizing: border-box;
          }
          .album-cover {
            width: 100%;
            padding-top: 100%;
            margin-bottom: 10px;
            background-size: contain;
          }
          .top-row {
            position: relative;
          }
          .titles {
            margin-bottom: 10px;
            margin-right: 35px;
            overflow: hidden;
          }
          .titles-track {
            white-space: nowrap;
          }
          .titles-artist {
            width: 100%;
            font-size: 8px;
            white-space: nowrap;
            color: rgba(0, 255, 0, .6);
          }
          .controls {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 5px;
            font-size: 20px;
          }
          .control {
            margin: 0 10px;
            cursor: pointer;
          }
          .control.play,
          .control.pause {
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            top: -1px;
            width: 20px;
            height: 20px;
          }
          .control.pause {
            font-size: 13px;
          }
          .time {
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            color: rgba(0, 255, 0, .6);
          }
          .timeline {
            cursor: pointer;
            background: rgba(0, 255, 0, .15);
          }
          .timeline-progress {
            position: relative;
            height: 5px;
            margin-bottom: 5px;
            background: #1ED760;
          }
          .timeline-progress::before {
            position: absolute;
            top: -2px;
            right: 0;
            content: '';
            display: block;
            width: 2px;
            height: 8px;
            background: #1ED760;
          }
          .volume-level {
            position: relative;
            left: 5px;
            bottom: 2px;
            display: flex;
            width: 15px;
            justify-content: space-between;
            align-items: flex-end;
          }
          .volume-line {
            width: 2px;
            background: white;
          }
          .heart-button {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 20px;
          }
          .heart-button.save-track {
            line-height: 1.2;
          }
          .heart-button.delete-track {
            line-height: 1.3;
          }
        `}</style>
      </div>
    )
  }
}

class FloatingText extends Component {
  constructor() {
    super()
    this.textRef = null
    this.wrapperRef = null
    this.textWidth = null
    this.wrapperWidth = null
    this.spacing = 50

    this.onTransitionEnd = this.onTransitionEnd.bind(this)
  }

  componentDidMount() {
    if (this.textRef && this.wrapperRef) {
      this.init()
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.text !== prevProps.text) {
      this.clearFloating()
      this.init()
    }
  }

  init() {
    this.textWidth = this.textRef.offsetWidth
    this.wrapperWidth = this.wrapperRef.offsetWidth
    this.isFloating = this.textWidth > this.wrapperWidth
    if (this.isFloating) {
      this.startFloating()
    }
  }

  clearFloating() {
    this.textRef.style.transitionDuration = '0ms'
    this.textRef.style.marginLeft = 0
  }

  startFloating() {
    this.textRef.style.transitionDuration = `${this.textWidth * 50}ms`
    this.textRef.style.marginLeft = `-${this.textWidth + this.spacing}px`
  }

  onTransitionEnd() {
    this.clearFloating()
    setTimeout(() => {
      this.startFloating()
    }, 2000)
  }

  render() {
    const { text, width = '100%' } = this.props

    return (
      <div>
        <div className="title-wrapper" ref={(ref) => this.wrapperRef = ref}>
          <div className="title-1"
               ref={(ref) => this.textRef = ref}
               onTransitionEnd={this.onTransitionEnd}>
            {text}</div>
          {this.isFloating ? (
            <div className="title-2">{text}</div>
          ) : null}
        </div>

        <style jsx>{`
          .title-wrapper {
            display: flex;
            width: ${width};
          }
          .title-1 {
            margin-right: ${this.spacing}px;
            transition-property: margin-left;
            transition-timing-function: linear;
          }
        `}</style>
      </div>
    )
  }
}

class PluginIcon extends Component {
  render() {
    return (
      <SvgIcon>
        <g fill="none" fillRule="evenodd" transform="translate(0,-1)">
          <g fill="none" fillRule="evenodd">
            <g
              className='spotify-icon'
              transform="translate(1.000000, 1.000000)"
            >
              <g>
                <path
                  d="m7.49996,1.06347c-3.55479,0 -6.43665,2.88178 -6.43665,6.43657c0,3.55494 2.88186,6.43649 6.43665,6.43649c3.55517,0 6.43672,-2.88155 6.43672,-6.43649c0,-3.55456 -2.88155,-6.43626 -6.4368,-6.43626l0.00008,-0.00031zm2.9518,9.28338c-0.11529,0.18908 -0.36279,0.24903 -0.55187,0.13297c-1.51126,-0.92311 -3.41374,-1.13218 -5.65427,-0.62028c-0.21591,0.04919 -0.43112,-0.08609 -0.48031,-0.30207c-0.04942,-0.21598 0.08532,-0.4312 0.30176,-0.48039c2.45189,-0.5604 4.55507,-0.31898 6.25172,0.71789c0.18908,0.11606 0.24903,0.36279 0.13297,0.55187zm0.78783,-1.75284c-0.14527,0.23635 -0.45425,0.31091 -0.69022,0.16564c-1.73016,-1.06369 -4.36752,-1.37168 -6.41397,-0.75048c-0.2654,0.08017 -0.54572,-0.06941 -0.62627,-0.33435c-0.07994,-0.2654 0.06971,-0.54518 0.33466,-0.62589c2.3376,-0.70928 5.24367,-0.36571 7.23055,0.85524c0.23597,0.14527 0.31052,0.45425 0.16525,0.68991l0,-0.00008zm0.06764,-1.82501c-2.0745,-1.23217 -5.49716,-1.34547 -7.47782,-0.74433c-0.31805,0.09646 -0.6544,-0.08309 -0.75079,-0.40114c-0.09638,-0.31821 0.08301,-0.65433 0.4013,-0.75102c2.27365,-0.69022 6.05334,-0.55686 8.44174,0.86101c0.28669,0.16979 0.38047,0.53926 0.2106,0.82496c-0.1691,0.28608 -0.53957,0.38039 -0.82473,0.21052l-0.00031,0z"
                  fill="#1ED760"
                />
              </g>
            </g>
          </g>
        </g>

        <style jsx>{`
          .spotify-icon {
            fill: #1ED760;
          }
        `}</style>
      </SvgIcon>
    )
  }
}

