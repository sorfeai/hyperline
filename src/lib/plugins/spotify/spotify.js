import React from 'react'
import Component from 'hyper/component'
import { osInfo } from 'systeminformation'
import util from 'util'
import cp from 'child_process'
import spotify from 'spotify-node-applescript'
import SvgIcon from '../../utils/svg-icon'

const exec = util.promisify(cp.exec)

const API_TOKEN = 'BQDymS8Xo1vNiouB-H48cuYPAqv7clpT11BOQLxdw6uwW0CkE3EohwCVvZ8FXmfYP0S05wyfVU9u44x1LI1w_WlmTdDfFvtDE84LhV9cdWyzBxNowKsZMWiJm3JotSVkieMTkpq3HDbwl2VbffCUsoGi38DzGkjiAbubr8REbQYe-5ZBRgUX4Yh9DagvB0RYzdU7pgAzb5za76e8cC9aCuP3MIVs6Qpz0O0IfNMEwObxqW0Ndq2AryZxJdVSY-477Kb-_MAPyuskOHf6qBQyXiBe5geMLMBy-vzOZeQfs1lC'

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
      showPlayerInfo: false
    }

    this.setStatus = this.setStatus.bind(this)
    this.openSpotify = this.openSpotify.bind(this)
  }

  setStatus() {
    osInfo().then(async ({ platform }) => {
      if (platform === 'darwin') {
        this.setStatusOSX()
      } else if (platform === 'linux') {
        // await this.setStatusLinux()
        this.getCurrentlyPlaying()
      }
    })
  }

  openSpotifyOSX() {
    spotify.isRunning((err, isRunning) => {
      if (!isRunning) {
        spotify.openSpotify()
      }

      if (err) {
        console.log(`Caught exception at handleSpotifyActivation(e): ${err}`)
      }
    })
  }

  setStatusOSX() {
    spotify.isRunning((err, isRunning) => {
      if (!isRunning) {
        this.setState({ state: 'Not running' })
        return
      }
      if (err) {
        console.log(`Caught exception at setStatus(e): ${err}`)
      }
      spotify.getState((err, st) => {
        if (err) {
          console.log(`Caught exception at spotify.getState(e): ${err}`)
        }

        spotify.getTrack((err, track) => {
          if (err) {
            console.log(`Caught exception at spotify.getTrack(e): ${err}`)
          }
          this.setState({
            state: `${st.state === 'playing'
              ? '▶'
              : '❚❚'} ${track.artist} - ${track.name}`
          })
        })
      })
    })
  }

  openSpotifyLinux() {
    if (!this.isRunning) {
      exec('spotify')
      this.isRunning = true
    }
  }

  setStatusLinux() {
    Promise.all([
      exec(`dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.freedesktop.DBus.Properties.Get \
            string:org.mpris.MediaPlayer2.Player string:Metadata | tr -d \'\\n\' | sed -E \'s/.*xesam:artist[^)]*string\\s+"([^"]*)".*/\\1/\'`),
      exec(`dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.freedesktop.DBus.Properties.Get \
            string:org.mpris.MediaPlayer2.Player string:Metadata | tr -d \'\\n\' | sed -E \'s/.*xesam:title[^)]*string\\s+"([^"]*)".*/\\1/\'`),
      exec(`dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.freedesktop.DBus.Properties.Get \
            string:org.mpris.MediaPlayer2.Player string:PlaybackStatus | tr -d '\\n' | sed -E 's/[^"]*"([^"]*)"/\\1/'`)
    ]).then(([{ stdout: artist }, { stdout: title }, { stdout: status, stderr }]) => {
      this.isRunning = !stderr
      if (stderr) {
        this.setState({ state: 'Not running' })
      } else {
        this.setState({ state: `${status === 'Playing' ? '▶' : '❚❚'} ${artist} — ${title}` })
      }
    })
  }

  getCurrentlyPlaying() {
    fetch('https://api.spotify.com/v1/me/player/currently-playing?market=RU', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      }
    }).then((res) => res.json())
      .then((data) => {
        // console.log(data)
        const item = data.item
        const album = item.album

        this.setState({
          loaded: true,
          isPlaying: data.is_playing,
          track: item.name,
          duration: item.duration_ms,
          progress: data.progress_ms,
          artist: album.artists[0].name,
          album: album.name,
          image: album.images[1].url
        })
      })
      .catch((err) => console.log(err))
  }

  onMouseDown(ev) {
    if (ev.button === 0) {
      this.openSpotify()
    } else if (ev.button === 1) {
      this.setState((state) => ({ showPlayerInfo: !state.showPlayerInfo }))
    }
  }

  onTimelineClick(ev) {
    if (!this.timelineRef) return
    const { duration } = this.state
    const { x, width } = this.timelineRef.getBoundingClientRect()
    const position = (ev.clientX - x) / width * duration
    this.seek(Math.floor(position))
  }

  openSpotify() {
    osInfo().then(async ({ platform }) => {
      if (platform === 'darwin') {
        this.openSpotifyOSX()
      } else if (platform === 'linux') {
        this.openSpotifyLinux()
      }
    })
  }

  play() {
    fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: this.getHeaders()
    }).then(() => {
      this.setState({ isPlaying: true })
    })
  }

  pause() {
    fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: this.getHeaders()
    }).then(() => {
      this.setState({ isPlaying: false })
    })
  }

  next() {
    fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: this.getHeaders()
    })
  }

  previous() {
    fetch('https://api.spotify.com/v1/me/player/previous', {
      method: 'POST',
      headers: this.getHeaders()
    })
  }

  seek(positionMs) {
    console.log(positionMs)
    fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
      method: 'PUT',
      headers: this.getHeaders()
    })
  }

  getHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`
    }
  }

  componentDidMount() {
    this.setStatus()
    this.interval = setInterval(() => this.setStatus(), 1000)
    this.getCurrentlyPlaying()
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    if (!this.state.loaded) return null;

    const { showPlayerInfo, isPlaying, track, album, artist, image, progress, duration } = this.state

    return (
      <div className='wrapper' onMouseDown={(ev) => this.onMouseDown(ev)}>
        <PluginIcon /> {isPlaying ? '▶' : '❚❚'} {artist} — {track}
        {showPlayerInfo ? (
          <div className="popup" onMouseDown={(ev) => ev.stopPropagation()}>
            <div className="album-cover" style={{ backgroundImage: `url(${image})` }} />
            <div className="controls">
              <span className="control previous" onClick={() => this.previous()}>⇤</span>
              {isPlaying ? (
                <span className="control pause" onClick={() => this.pause()}>❚❚</span>
              ) : (
                <span className="control play" onClick={() => this.play()}>▶</span>
              )}
              <span className="control next" onClick={() => this.next()}>⇥</span>
            </div>
            <div className="timeline" ref={(ref) => this.timelineRef = ref} onClick={(ev) => this.onTimelineClick(ev)}>
              <div className="timeline-progress" style={{ width: `${progress/duration*100}%` }} />
            </div>
          </div>
        ) : null}

        <style jsx>{`
          .wrapper {
            display: flex;
            align-items: center;
            margin-left: auto;
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
          }
          .controls {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 10px;
            font-size: 20px;
            color: #1ED760;
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
          .timeline {
            cursor: pointer;
          }
          .timeline-progress {
            height: 5px;
            background: #1ED760;
          }
        `}</style>
      </div>
    )
  }
}
