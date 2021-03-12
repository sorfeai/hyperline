
const API_HOST = 'https://api.spotify.com/v1'
const API_TOKEN = 'BQB74XtkOi5fyeF1nlMBcyYXCTT5cLLxrdjeCf0iCFawnnguQrgWjlkQ7VjLP-0xqTVWjLtdBljvWZ-EkC5Zbq2yJ8-6S-JgfqOKUzysffJ8eMt5BTSUQGoW9rl0-T8-3Ako2ze--TOQceoKoGdYFlhVirP90Et-s_XUnlebhRKY_Ir2bz__F8D_xKmasOABvE-WfNtww3bMKC-TARXOhkxWB5gU7PHTMKI3WS5vJzdctHOlUd18qw2Pr0VwEYjY9k9fVy2KlfcmKLNsBWwKpTtk4aO4qUmsP7u1jbgMHgsW'
const client_id = 'cff568f29ac7425fa33f8d2a672f1813'

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
}

const authScopes = [
  'user-read-recently-played',
  'user-top-read',
  'user-read-playback-position',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'app-remote-control',
  'streaming',
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-follow-modify',
  'user-follow-read',
  'user-library-modify',
  'user-library-read',
  'user-read-email',
  'user-read-private'
]

export function authUser() {
  const scope = authScopes.join('%20')
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&scope=${scope}&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback`
  window.open(authUrl)
}

export function getCurrentlyPlaying() {
  return fetch(`${API_HOST}/me/player/currently-playing?market=RU`, {
    method: 'GET',
    headers
  })
    .then((res) => res.json())
    .catch((err) => console.log(err))
}

export function getIsTrackSaved(trackId) {
  return fetch(`${API_HOST}/me/tracks/contains?ids=${trackId}`, {
    method: 'GET',
    headers
  })
    .then((res) => res.json())
    .then((res) => res[0])
    .catch((err) => console.log(err))
}

export function getDevices() {
  return fetch(`${API_HOST}/me/player/devices`, {
    method: 'GET',
    headers
  })
    .then((res) => res.json())
    .catch((err) => console.log(err))
}

export function playTrack(contextUri, position) {
  return fetch(`${API_HOST}/me/player/play`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      context_uri: contextUri,
      offset: { position },
      position_ms: 0
    })
  })
    .catch((err) => console.log(err))
}

export function playCurrentTrack(contextUri, position) {
  return fetch(`${API_HOST}/me/player/play`, {
    method: 'PUT',
    headers
  })
    .catch((err) => console.log(err))
}

export function pauseCurrentTrack() {
  return fetch(`${API_HOST}/me/player/pause`, {
    method: 'PUT',
    headers
  })
    .catch((err) => console.log(err))
}

export function next() {
  return fetch(`${API_HOST}/me/player/next`, {
    method: 'POST',
    headers
  })
    .catch((err) => console.log(err))
}

export function previous() {
  return fetch(`${API_HOST}/me/player/previous`, {
    method: 'POST',
    headers
  })
    .catch((err) => console.log(err))
}

export function seek(positionMs) {
  return fetch(`${API_HOST}/me/player/seek?position_ms=${positionMs}`, {
    method: 'PUT',
    headers
  })
    .catch((err) => console.log(err))
}

export function setVolume(value) {
  return fetch(`${API_HOST}/me/player/volume?volume_percent=${value}`, {
    method: 'PUT',
    headers
  })
    .catch((err) => console.log(err))
}

export function saveTrack(id) {
  fetch(`${API_HOST}/me/tracks?ids=${id}`, {
    method: 'PUT',
    headers
  })
    .catch((err) => console.log(err))
}

export function deleteTrack(id) {
  fetch(`${API_HOST}/me/tracks?ids=${id}`, {
    method: 'DELETE',
    headers
  })
    .catch((err) => console.log(err))
}

export function getLibraryAlbums() {
  return fetch(`${API_HOST}/me/albums`, {
    method: 'GET',
    headers
  })
    .then((res) => res.json())
    .catch((err) => console.log(err))
}

export function getAlbumTracks(id) {
  return fetch(`${API_HOST}/albums/${id}/tracks?market=RU&limit=50`, {
    method: 'GET',
    headers
  })
    .then((res) => res.json())
    .catch((err) => console.log(err))
}
