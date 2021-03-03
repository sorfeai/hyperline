
const API_HOST = 'https://api.spotify.com/v1'
const API_TOKEN = 'BQBdC_tS1zg78E6bn8Jb7kVczsdfSl6rvzsBmk1_f7WBr1ZhTt2ZaDCqhsPdAipA_pPHQPEijMARlvHr0smkXZhyePMb78XblkLB4vTXAXoxXobxWVuQC-VOZu5Lm5GIq-KXgN9H3l_DF8iMnFLMTbTO3yBRHucY6Z8f95LYr0ShOy2WNd3VVia-ZyL3WYgJSMrrNoFY73stR6vHdxbqhWsZJ9S6k0nKxAn_IJVTXIgVT6cnL56G_M_kLkPA9JBSWmGP9-V8BfUXCPwR467eHUgJekM9lPnvxyBbL8-bzDn6'

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
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
