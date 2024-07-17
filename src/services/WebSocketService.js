class WebSocketService {
  constructor() {
    this.websocket = null
    this.reconnectInterval = null
    this.reconnectAttempts = 0
    this.messageHandlers = new Set()
    this.lastUrl = null
    this.heartbeatInterval = null
    this.missedHeartbeats = 0
  }

  initializeWebSocket(url) {
    this.lastUrl = url
    this.websocket = new WebSocket(url)
    this.websocket.onmessage = (event) => {
      this.notifyMessageHandlers(event.data)
      const data = JSON.parse(event.data)
      if (data.content === 'pong') {
        console.log('Received pong from the server')
        this.missedHeartbeats = 0 // 重置心跳检测计数
      }
    }
    this.websocket.onopen = () => {
      this.handleWebSocketOpen()
      this.startHeartbeat()
    }
    this.websocket.onerror = this.handleWebSocketError.bind(this)
    this.websocket.onclose = this.handleWebSocketClose.bind(this)
  }

  registerMessageHandler(handler) {
    this.messageHandlers.add(handler)
  }

  unregisterMessageHandler(handler) {
    this.messageHandlers.delete(handler)
  }

  notifyMessageHandlers(data) {
    this.messageHandlers.forEach((handler) => handler(data))
  }

  handleWebSocketOpen() {
    console.log('Connected to the WebSocket server')
    this.reconnectAttempts = 0
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }
  }

  handleWebSocketError(error) {
    console.error('WebSocket Error:', error)
  }

  handleWebSocketClose(event) {
    console.log('WebSocket is closed now:', event)
    this.stopHeartbeat()
    if (!this.reconnectInterval) {
      this.reconnectWebSocket()
    }
  }

  reconnectWebSocket() {
    const MAX_RECONNECT_ATTEMPTS = 10
    const RECONNECT_INTERVAL_BASE = 1000
    const RECONNECT_INTERVAL_MAX = 30000

    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS && this.lastUrl) {
      let reconnectDelay = Math.min(
        RECONNECT_INTERVAL_BASE * Math.pow(2, this.reconnectAttempts),
        RECONNECT_INTERVAL_MAX
      )
      setTimeout(() => {
        console.log(`Attempting to reconnect... (Attempt: ${this.reconnectAttempts + 1})`)
        this.initializeWebSocket(this.lastUrl)
      }, reconnectDelay)
      this.reconnectAttempts++
    } else {
      console.error('Max WebSocket reconnect attempts reached.')
    }
  }

  sendMessage(message) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(message)
    } else {
      console.error('WebSocket is not open. Message not sent:', message)
    }
  }
  closeWebSocket() {
    if (this.websocket) {
      console.log('Closing WebSocket connection...')
      this.websocket.close()
    }
  }

  getReadyState() {
    return this.websocket ? this.websocket.readyState : WebSocket.CLOSED
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.websocket.readyState === WebSocket.OPEN) {
        this.sendMessage('ping')
        this.missedHeartbeats++
        if (this.missedHeartbeats > 3) {
          console.warn('No pong received after 3 heartbeats, reconnecting...')
          this.websocket.close()
        }
      }
    }, 30000)
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatInterval)
    this.heartbeatInterval = null
    this.missedHeartbeats = 0
  }
}

const webSocketService = new WebSocketService()
export default webSocketService
