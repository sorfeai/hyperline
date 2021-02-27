
const API_HOST = 'https://api.spotify.com/v1'
const API_TOKEN = 'BQDJg2-CFBakct6KUEcSFl2OL_aYSkffzGZrgkn8EkRH2z0WtLUABTe4KrZOY1Pot4ReXzT82WiyF9UziDlLQNUEYsJhZ2qVLqnGUV8VxkJlwY7fovP1Dlt-eO7LH7u5o52O0eXNpfAOEy-s6CnEaSd2DY83qo6RDKbRpviw4xF7jPRvjHTDijjEXMfQDaaQCx2WRGp8G75V2YcbhxTcAuUOp43itVfre5NfpjOSOGy2HdVP4xEPLA7fVd1THI_TpndPRwHuYXT2F_4fZjeWqyJezduz-3dyCkh1UbOD61of'

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

export function play() {
  return fetch(`${API_HOST}/me/player/play`, {
    method: 'PUT',
    headers
  })
    .catch((err) => console.log(err))
}

export function pause() {
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
