import axios from 'axios'

const baseURL = process.env.NODE_ENV === 'production' ? process.env.VITE_APP_HTTP_END_POINT : ''

const client = axios.create({
  baseURL: baseURL + '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  getPlatformData(platform) {
    return client.get(`/insight?platform=${platform}`)
  },
  fetchAndUpdateStatus(reset = false) {
    const url = reset ? '/insight/updates-status?reset=true' : '/insight/updates-status'
    return client.get(url)
  }
}
