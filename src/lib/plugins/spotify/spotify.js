import React from 'react'
import Component from 'hyper/component'
import spotify from 'spotify-node-applescript'
import SvgIcon from '../../utils/svg-icon'
import {
  getAlbumTracks,
  getCurrentlyPlaying,
  getDevices,
  getIsTrackSaved, getLibraryAlbums,
  next,
  pause, pauseCurrentTrack,
  play, playCurrentTrack, playTrack,
  previous, saveTrack,
  seek,
  setVolume
} from './spotify-api';

export default class Spotify extends Component {
  static displayName() {
    return 'spotify'
  }

  constructor(props) {
    super(props)

    this.state = {
      version: 'Not running',
      isLoaded: false,
      showMiniPlayer: false,
      showLibrary: false,
      currentlyPlaying: null,
      library: {
        selectedAlbum: null,
        albums: [],
        tracks: {}
      }
    }
    this.options = Object.assign({}, this.getDefaultOptions(), this.props.options)

    this.update = this.update.bind(this)
    this.getCurrentlyPlaying = this.getCurrentlyPlaying.bind(this)
    this.playCurrentTrack = this.playCurrentTrack.bind(this)
    this.pauseCurrentTrack = this.pauseCurrentTrack.bind(this)
    this.toggleLibrary = this.toggleLibrary.bind(this)
    this.onTimelineClick = this.onTimelineClick.bind(this)
    this.onAlbumClick = this.onAlbumClick.bind(this)
  }

  componentDidMount() {
    this.update()
      .then(() => {
        this.setState({ isLoaded: true })
      })
    this.interval = setInterval(this.update, 1000)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  getDefaultOptions() {
    return { miniPlayer: true }
  }

  update() {
    return Promise.all([
      this.getCurrentlyPlaying(),
      this.getVolume(),
      this.getLibraryAlbums()
    ])
  }

  getCurrentlyPlaying() {
    return getCurrentlyPlaying()
      .then((data) => {
        this.setCurrentlyPlaying(data)
        return getIsTrackSaved(data.item.id)
      })
      .then((trackSaved) => {
        const { isSaved } = this.state.currentlyPlaying
        if ((trackSaved && !isSaved) || (!trackSaved && isSaved)) {
          this.toggleIsSaved()
        }
      })
  }

  getVolume() {
    return getDevices()
      .then((data) => {
        const device = data.devices.find((dev) => dev.type === 'Computer')
        this.setVolume(device.volume_percent)
      })
  }

  getLibraryAlbums() {
    return getLibraryAlbums()
      .then((data) => {
        this.setState((state) => ({
          ...state,
          library: {
            ...state.library,
            albums: data.items.map((item) => ({
              id: item.album.id,
              uri: item.album.uri,
              title: item.album.name,
              artist: item.album.artists[0].name,
              image: item.album.images[2].url
            }))
          }
        }))
      })
  }

  getAlbumTracks(id) {
    return getAlbumTracks(id)
      .then((data) => {
        this.setState((state) => ({
          ...state,
          library: {
            ...state.library,
            tracks: {
              ...state.library.tracks,
              [id]: data.items.map((item) => ({
                id: item.id,
                title: item.name,
                number: item.track_number,
              }))
            }
          }
        }))
      })
  }

  saveTrack(id) {
    return saveTrack(id)
      .then(() => {
        this.toggleIsSaved()
      })
  }

  deleteTrack(id) {
    return deleteTrack(id)
      .then(() => {
        this.toggleIsSaved()
      })
  }

  playCurrentTrack() {
    return playCurrentTrack()
      .then(() => {
        this.toggleIsPlaying()
      })
  }

  pauseCurrentTrack() {
    return pauseCurrentTrack()
      .then(() => {
        this.toggleIsPlaying()
      })
  }

  setCurrentlyPlaying(data) {
    const item = data.item
    const album = item.album
    this.setState((state) => ({
      ...state,
      currentlyPlaying: {
        ...state.currentlyPlaying,
        isPlaying: data.is_playing,
        track: item.name,
        trackId: item.id,
        duration: item.duration_ms,
        progress: data.progress_ms,
        artist: album.artists[0].name,
        album: album.name,
        image: album.images[1].url
      }
    }))
  }

  setVolume(value) {
    this.setState((state) => ({
      ...state,
      currentlyPlaying: {
        ...state.currentlyPlaying,
        volumePercent: value
      }
    }))
  }

  setSelectedAlbum(id) {
    this.setState((state) => ({
      ...state,
      library: {
        ...state.library,
        selectedAlbum: id
      }
    }))
  }

  toggleIsPlaying() {
    this.setState((state) => ({
      ...state,
      currentlyPlaying: {
        ...state.currentlyPlaying,
        isPlaying: !state.currentlyPlaying.isPlaying
      }
    }))
  }

  toggleIsSaved() {
    this.setState((state) => ({
      ...state,
      currentlyPlaying: {
        ...state.currentlyPlaying,
        isSaved: !state.currentlyPlaying.isSaved
      }
    }))
  }

  toggleMiniPlayer() {
    this.setState((state) => ({
      ...state,
      showMiniPlayer: !state.showMiniPlayer,
      showLibrary: false
    }))
  }

  toggleLibrary() {
    this.setState((state) => ({
      ...state,
      showLibrary: !state.showLibrary
    }))
  }

  onMouseDown(ev) {
    if (ev.button === 0) {
      // this.openSpotify()
    } else if (ev.button === 1 && this.options.miniPlayer) {
      this.toggleMiniPlayer()
    }
  }

  onWheel(ev) {
    const { volumePercent } = this.state.currentlyPlaying
    const d = -Math.floor(ev.deltaY/10)
    const volume = Math.min(Math.max(0, volumePercent + d), 100)
    this.setVolume(volume)
    setVolume(volume)
  }

  onTimelineClick(ev) {
    if (!this.timelineRef) return
    const { duration } = this.state.currentlyPlaying
    const { x, width } = this.timelineRef.getBoundingClientRect()
    const position = (ev.clientX - x) / width * duration
    seek(Math.floor(position))
  }

  onAlbumClick(albumId) {
    this.getAlbumTracks(albumId)
      .then(() => this.setSelectedAlbum(albumId))
  }

  onTrackClick(track) {
    const { selectedAlbum, albums } = this.state.library
    const album = albums.find((album) => album.id === selectedAlbum)
    return playTrack(album.uri, track.number - 1)
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000)
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  render() {
    if (!this.state.isLoaded) return null;

    const {
      showMiniPlayer,
      showLibrary,
      currentlyPlaying: { isPlaying, isSaved, track, artist, image, progress, duration, volumePercent, trackId },
      library: { selectedAlbum, albums, tracks }
    } = this.state

    const volumeLines = Math.floor((volumePercent+5) / 20)

    return (
      <div className="wrapper">
        <PluginIcon />
        <div className="currently-playing"
             onMouseDown={(ev) => this.onMouseDown(ev)}
             onWheel={(ev) => this.onWheel(ev)}>
          <span className="play-status">
            {isPlaying ? '▶' : '❚❚'} {artist} — {track}
          </span>
          <div className="volume-level">
            {new Array(5).fill(0).map((_, index) => (
              <div className="volume-line"
                   style={{ height: `${2 + index*2}px`, opacity: index+1 <= volumeLines ? 1 : 0 }} />
            ))}
          </div>
        </div>
        {showMiniPlayer ? (
          <React.Fragment>
            <div className="popup mini-player" onMouseDown={(ev) => ev.stopPropagation()}>
              <div className="album-cover" style={{ backgroundImage: `url(${image})` }} />
              <div className="top-row">
                <div className="titles">
                  <div className="titles-track">
                    <FloatingText text={track} />
                  </div>
                  <div className="titles-artist small-text">
                    <FloatingText text={artist} />
                  </div>
                </div>
                {isSaved ? (
                  <div className="control heart-button save-track" onClick={() => this.deleteTrack(trackId)}>♥</div>
                ) : (
                  <div className="control heart-button delete-track" onClick={() => this.saveTrack(trackId)}>♡</div>
                )}
              </div>
              <div className="timeline"
                   ref={(ref) => this.timelineRef = ref}
                   onClick={this.onTimelineClick}>
                <div className="timeline-progress" style={{ width: `${progress/duration*100}%` }} />
              </div>
              <div className="time small-text">
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
                  <span className="control pause" onClick={this.pauseCurrentTrack}>❚❚</span>
                ) : (
                  <span className="control play" onClick={this.playCurrentTrack}>▶</span>
                )}
                <span className="control next" onClick={next}>⇥</span>
              </div>
            </div>
            {showLibrary ? (
              <React.Fragment>
                <div className="popup library">
                  <div className="library-albums">
                    {albums.map((album) => (
                      <div className="library__album-row">
                        <div className="library__side-col">
                          <div className="library__album-cover"
                               style={{ backgroundImage: `url(${album.image})` }}
                               onClick={() => this.onAlbumClick(album.id)} />
                        </div>
                        <div className="library__content-col titles-track">
                          <div className="library__album-title">
                            <FloatingText text={album.title} />
                          </div>
                          <div className="library__album-artist small-text">
                            <FloatingText text={album.artist} />
                          </div>
                          {(selectedAlbum === album.id && tracks[album.id]) ? (
                            <div className="library__album-tracks">
                              {tracks[album.id].map((track) => (
                                <div className="library__album-track">
                                  <div className="library__track-number small-text">{track.number}</div>
                                  <div className="library__track-title" onClick={() => this.onTrackClick(track)}>
                                    <FloatingText text={`${trackId === track.id ? '▶ ' : ''}${track.title}`} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="library-button close" onClick={this.toggleLibrary}>
                  {'⤫'}
                </div>
              </React.Fragment>
            ) : (
              <div className="library-button open" onClick={this.toggleLibrary}>
                {'▶'}
              </div>
            )}
          </React.Fragment>
        ) : null}

        <style jsx>{`
          .small-text {
            font-size: 8px;
            color: rgba(0, 255, 0, .6);
          }
          .wrapper {
            position: relative;
            display: flex;
            align-items: center;
            margin-left: auto;
            color: #1ED760;
          }
          .currently-playing {
            display: flex;
          }
          .popup {
            position: absolute;
            bottom: 24px;
            width: 200px;
            height: 290px;
            padding: 6px;
            border: 1px solid #1ED760;
            background: rgba(0,0,0,.75);
            box-sizing: border-box;
            overflow: hidden;
          }
          .play-status {
            color: white;
          }
          .volume-level {
            position: relative;
            left: 5px;
            bottom: 4px;
            display: flex;
            width: 15px;
            justify-content: space-between;
            align-items: flex-end;
          }
          .volume-line {
            width: 2px;
            background: white;
          }
          
          // mini player
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
            white-space: nowrap;
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
          
          // library
          .popup.library {
            left: 205px;
            overflow-y: scroll;
          }
          .library-button {
            position: absolute;
            top: -298px;
            left: 205px;
            text-align: center;
            line-height: 14px;
            width: 15px;
            height: 15px;
            border: 1px solid #1ED760;
            cursor: pointer;
          }
          .library-button.close {
            left: 410px;
            line-height: 15px;
            text-indent: -1px;
          }
          .library__album-row {
            display: flex;
            margin-bottom: 5px;
          }
          .library__album-cover {
            width: 30px;
            height: 30px;
            background-repeat: no-repeat;
            background-size: contain;
            cursor: pointer;
          }
          .library__content-col {
            max-width: calc(100% - 30px);
            margin-left: 5px;
          }
          .library__album-tracks {
            margin-top: 5px;
          }
          .library__album-track {
            display: flex;
            margin-bottom: 5px;
          }
          .library__track-number {
            display: flex;
            align-items: center;
            min-width: 14px;
          }
          .library__track-title {
            max-width: calc(100% - 14px);
            cursor: pointer;
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
      this.forceUpdate()
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
            {text}
          </div>
          {this.isFloating ? (
            <div className="title-2">{text}</div>
          ) : null}
        </div>

        <style jsx>{`
          .title-wrapper {
            display: flex;
            width: ${width};
            overflow: hidden;
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

