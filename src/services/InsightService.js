import axios from 'axios'

const baseURL = process.env.NODE_ENV === 'production' ? 'https://' : ''

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  getInsightData() {
    return client.get('/insight/list')
  },
  getInsightDataByDate(date) {
    return client.get(`/data?date=${date}`)
  },
  getInsightDataByDateRange(startDate, endDate) {
    return client.get(`/data?startDate=${startDate}&endDate=${endDate}`)
  }
}
