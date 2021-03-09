import React from 'react'
import Component from 'hyper/component'
import spotify from 'spotify-node-applescript'
import {
  deleteTrack,
  getAlbumTracks,
  getCurrentlyPlaying,
  getDevices,
  getIsTrackSaved,
  getLibraryAlbums,
  next,
  pauseCurrentTrack,
  playCurrentTrack,
  playTrack,
  previous,
  saveTrack,
  seek,
  setVolume
} from './spotify-api';
import { FloatingText } from './floating-text';
import { PluginIcon } from './icon';

const stateSetters = {
  setCurrentlyPlaying: data => state => {
    const item = data.item
    const album = item.album
    return {
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
    }
  },
  setLibraryAlbums: data => state => {
    return {
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
    }
  },
  setVolume: value => state => {
    return {
      ...state,
      currentlyPlaying: {
        ...state.currentlyPlaying,
        volumePercent: value
      }
    }
  },
  setAlbumTracks: data => state => {
    return {
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
    }
  },
  setSelectedAlbum: id => state => {
    return {
      ...state,
      library: {
        ...state.library,
        selectedAlbum: id
      }
    }
  },
  toggleIsPlaying: () => state => {
    return {
      ...state,
      currentlyPlaying: {
        ...state.currentlyPlaying,
        isPlaying: !state.currentlyPlaying.isPlaying
      }
    }
  },
  toggleIsSaved: () => state => {
    return {
      ...state,
      currentlyPlaying: {
        ...state.currentlyPlaying,
        isSaved: !state.currentlyPlaying.isSaved
      }
    }
  },
  toggleMiniPlayer: () => state => {
    return {
      ...state,
      showMiniPlayer: !state.showMiniPlayer,
      showLibrary: false
    }
  },
  toggleLibrary: () => state => {
    return {
      ...state,
      showLibrary: !state.showLibrary
    }
  }
}

export default class Spotify extends Component {
  static displayName() {
    return 'spotify'
  }

  constructor(props) {
    super(props)

    this.state = this.getInitialState()
    this.options = Object.assign({}, this.getDefaultOptions(), this.props.options)

    this.update = this.update.bind(this)
    this.getCurrentlyPlaying = this.getCurrentlyPlaying.bind(this)
    this.playCurrentTrack = this.playCurrentTrack.bind(this)
    this.pauseCurrentTrack = this.pauseCurrentTrack.bind(this)
    this.seek = this.seek.bind(this)
    this.selectAlbum = this.selectAlbum.bind(this)
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

  getInitialState() {
    return {
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
    const { setCurrentlyPlaying, toggleIsSaved } = stateSetters
    return getCurrentlyPlaying()
      .then((data) => {
        this.setState(setCurrentlyPlaying(data))
        return getIsTrackSaved(data.item.id)
      })
      .then((trackSaved) => {
        const { isSaved } = this.state.currentlyPlaying
        if ((trackSaved && !isSaved) || (!trackSaved && isSaved)) {
          this.setState(toggleIsSaved())
        }
      })
  }

  getVolume() {
    const { setVolume } = stateSetters
    return getDevices()
      .then((data) => {
        const device = data.devices.find((dev) => dev.type === 'Computer')
        this.setState(setVolume(device.volume_percent))
      })
  }

  getLibraryAlbums() {
    const { setLibraryAlbums } = stateSetters
    return getLibraryAlbums()
      .then((data) => {
        this.setState(setLibraryAlbums(data))
      })
  }

  getAlbumTracks(id) {
    const { setAlbumTracks } = stateSetters
    return getAlbumTracks(id)
      .then((data) => {
        this.setState(setAlbumTracks(data))
      })
  }

  saveTrack(id) {
    return saveTrack(id)
      .then(() => {
        this.toggleIsSaved()
      })
  }

  removeFromSaved(id) {
    console.log(`unsaving ${id}`)
    return deleteTrack(id)
      .then(() => {
        this.toggleIsSaved()
      })
  }

  playCurrentTrack() {
    const { toggleIsPlaying } = stateSetters
    return playCurrentTrack()
      .then(() => {
        this.setState(toggleIsPlaying())
      })
  }

  pauseCurrentTrack() {
    return pauseCurrentTrack()
      .then(() => {
        this.toggleIsPlaying()
      })
  }

  updateVolume(ev) {
    const { volumePercent } = this.state.currentlyPlaying
    const d = -Math.floor(ev.deltaY/10)
    const volume = Math.min(Math.max(0, volumePercent + d), 100)

    this.setState(stateSetters.setVolume(volume))
    setVolume(volume)
  }

  seek(ev) {
    if (!this.timelineRef) return
    const { duration } = this.state.currentlyPlaying
    const { x, width } = this.timelineRef.getBoundingClientRect()
    const position = (ev.clientX - x) / width * duration

    seek(Math.floor(position))
      .then(() => this.update())
  }

  selectAlbum(albumId) {
    const { setSelectedAlbum } = stateSetters
    this.getAlbumTracks(albumId)
      .then(() => this.setState(setSelectedAlbum(albumId)))
  }

  playTrack(track) {
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

  onMouseDown(ev) {
    const { toggleMiniPlayer } = stateSetters
    if (ev.button === 0) {
      // this.openSpotify()
    } else if (ev.button === 1 && this.options.miniPlayer) {
      this.setState(toggleMiniPlayer())
    }
  }

  renderVolume() {
    const { currentlyPlaying: { volumePercent } } = this.state
    const totalLines = 5
    const visibleLines = Math.floor((volumePercent+5) / 20)

    return (
      <div className="volume-level">
        {new Array(totalLines)
          .fill(0)
          .map((_, index) => (
            <div className="volume-line"
                 style={{ height: `${2 + index*2}px`, opacity: index+1 <= visibleLines ? 1 : 0 }} />
          ))}
        <style jsx>{`
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
        `}</style>
      </div>
    )
  }

  renderMiniPlayer() {
    const { toggleLibrary } = stateSetters
    const {
      showLibrary,
      currentlyPlaying: { isPlaying, isSaved, track, artist, image, progress, duration, trackId }
    } = this.state

    return (
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
              <div className="control heart-button save-track" onClick={() => this.removeFromSaved(trackId)}>♥</div>
            ) : (
              <div className="control heart-button delete-track" onClick={() => this.saveTrack(trackId)}>♡</div>
            )}
          </div>
          <div className="timeline"
               ref={(ref) => this.timelineRef = ref}
               onClick={this.seek}>
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
        {showLibrary ? this.renderLibrary() : (
          <div className="library-button open" onClick={() => this.setState(toggleLibrary())}>
            {'▶'}
          </div>
        )}

        <style jsx>{`
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
          .small-text {
            font-size: 8px;
            color: rgba(0, 255, 0, .6);
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
        `}</style>
      </React.Fragment>
    )
  }

  renderLibrary() {
    const { library: { selectedAlbum, albums, tracks } } = this.state

    return (
      <React.Fragment>
        <div className="popup library">
          <div className="library-albums">
            {albums.map((album) => (
              <div className="library__album-row">
                <div className="library__side-col">
                  <div className="library__album-cover"
                       style={{ backgroundImage: `url(${album.image})` }}
                       onClick={() => this.selectAlbum(album.id)} />
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
                          <div className="library__track-title" onClick={() => this.playTrack(track)}>
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

        <style jsx>{`
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
          .small-text {
            font-size: 8px;
            color: rgba(0, 255, 0, .6);
          }
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
      </React.Fragment>
    )
  }

  render() {
    if (!this.state.isLoaded) return null
    const { showMiniPlayer, currentlyPlaying: { isPlaying, track, artist } } = this.state

    return (
      <div className="wrapper">
        <PluginIcon />
        <div className="currently-playing"
             onMouseDown={(ev) => this.onMouseDown(ev)}
             onWheel={(ev) => this.updateVolume(ev)}>
          <span className="play-status">
            {isPlaying ? '▶' : '❚❚'} {artist} — {track}
          </span>
          {this.renderVolume()}
        </div>
        {showMiniPlayer ? this.renderMiniPlayer() : null}

        <style jsx>{`
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
          .play-status {
            color: white;
          }
        `}</style>
      </div>
    )
  }
}

