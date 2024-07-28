import axios from 'axios'

const baseURL = process.env.NODE_ENV === 'production' ? process.env.VITE_APP_HTTP_END_POINT : ''

console.log('baseUrl', baseURL)

const client = axios.create({
  base: baseURL + '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  get36KrAIData() {
    return client.get('/insight/36kr')
  },
  getChaPingData() {
    return client.get('/insight/chaping')
  },
  getAliResearchData() {
    return client.get('/insight/aliresearch')
  },
  getInsightDataByDate(date) {
    return client.get(`/data?date=${date}`)
  },
  getInsightDataByDateRange(startDate, endDate) {
    return client.get(`/data?startDate=${startDate}&endDate=${endDate}`)
  }
}
