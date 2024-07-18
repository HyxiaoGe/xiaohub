class WebSocketService {
  constructor() {
    this.websocket = null
    this.reconnectInterval = null
    this.reconnectAttempts = 0
    this.messageHandlers = new Set()
    this.lastUrl = null
    this.heartbeatInterval = null
    this.missedHeartbeats = 0
    this.userActivityTimeout = null
    this.webSocketCloseTimeout = null
    this.userInactive = false
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
    this.startUserActivityMonitor()
  }

  handleWebSocketError(error) {
    console.error('WebSocket Error:', error)
  }

  handleWebSocketClose(event) {
    console.log('WebSocket is closed now:', event)
    this.websocket = null
    this.stopHeartbeat()
    this.stopUserActivityMonitor()
    if (!this.reconnectInterval) {
      this.reconnectWebSocket()
    }
  }

  reconnectWebSocket() {
    if (this.userInactive) {
      return
    }
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
      this.websocket.close()
    }
  }

  getReadyState() {
    return this.websocket ? this.websocket.readyState : WebSocket.CLOSED
  }

  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.sendMessage('ping')
        this.missedHeartbeats++
        // console.log('Missed heartbeats:', this.missedHeartbeats)
        if (this.missedHeartbeats > 3) {
          console.warn('No pong received after 3 heartbeats, reconnecting...')
          this.websocket.close()
        }
      }
    }, 30000)
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      console.log('用户未活跃，停止心跳')
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
      this.missedHeartbeats = 0
    }
  }

  startUserActivityMonitor() {
    this.resetUserActivityTimeout()

    const userActivityEvents = ['mousemove', 'keydown', 'scroll', 'click']

    this.userActivityListener = () => {
      if (this.websocket == null) {
        this.reconnectWebSocket()
      } else if (this.userInactive) {
        this.userInactive = false
        console.log('用户活跃，开始心跳')
        this.startHeartbeat()
      }
      this.resetUserActivityTimeout()
    }
    userActivityEvents.forEach((event) => {
      document.addEventListener(event, this.userActivityListener)
    })
  }

  stopUserActivityMonitor() {
    clearTimeout(this.userActivityTimeout)
    clearTimeout(this.webSocketCloseTimeout)
    const userActivityEvents = ['mousemove', 'keydown', 'scroll', 'click']
    userActivityEvents.forEach((event) => {
      document.removeEventListener(event, this.userActivityListener)
    })
  }

  resetUserActivityTimeout() {
    clearTimeout(this.userActivityTimeout)
    clearTimeout(this.webSocketCloseTimeout)
    this.userActivityTimeout = setTimeout(() => {
      this.userInactive = true
      this.stopHeartbeat()

      this.webSocketCloseTimeout = setTimeout(() => {
        if (this.userInactive && this.websocket != null) {
          this.closeWebSocket()
        }
      }, 300000) // 10分钟用户不活跃关闭WebSocket
    }, 300000) // 5分钟没有活跃行为视为用户不活跃
  }
}

const webSocketService = new WebSocketService()
export default webSocketService
