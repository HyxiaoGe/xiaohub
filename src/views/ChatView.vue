<script>
import SidebarView from './SidebarView.vue'
import WebSocketService from '@/services/WebSocketService'
import SessionService from '@/services/SessionService'
import MessageFormatter from '@/services/MessageFormatter'

import Assistants from '@/common/Assistant'

export default {
  components: {
    SidebarView
  },
  name: 'ChatView',
  data() {
    return {
      userMessage: '',
      conversation: [], // 存储用户消息的数组
      firstAssistantMessage: '',
      currentAssistantMessage: '',
      verificationKey: '',
      showScrollButton: false,
      isVerified: false,
      sessions: [
        Assistants.smartAssistant,
        Assistants.programmingAssistant,
        Assistants.memeExpert,
        Assistants.languageAssistant,
        Assistants.encyclopedia
      ],
      activeSessionId: 1,
      uploadedFile: null,
      uploadedFileUrl: '',
      base64Url: null,
      messageQueues: {},
      fileList: []
    }
  },
  created() {
    // WebSocketService.initializeWebSocket('ws://localhost:8808/ws')
    WebSocketService.initializeWebSocket(`ws://${process.env.VITE_APP_END_POINT}/chat/ws`)
    WebSocketService.registerMessageHandler(this.handleWebSocketMessage)
    this.isVerified = SessionService.get('isVerified') === 'true'
    this.loadActiveSession()
    this.initializeQueues()
    this.loadSessionsFromLocalStorage()
    this.scrollToBottom()
  },
  methods: {
    loadSessionsFromLocalStorage() {
      const savedSessions = SessionService.get('chatSessions')
      if (savedSessions) {
        this.sessions = JSON.parse(savedSessions)
      }
      this.loadActiveSessionMessages()
    },
    initializeQueues() {
      this.sessions.forEach((session) => {
        this.initMessageQueueForSession(session.id)
      })
    },
    initMessageQueueForSession(sessionId) {
      this.messageQueues[sessionId] = []
    },
    onScroll() {
      const messagesContainer = this.$refs.messagesContainer
      const nearBottom =
        messagesContainer.scrollHeight -
          messagesContainer.scrollTop -
          messagesContainer.clientHeight <
        10
      this.showScrollButton = !nearBottom
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const messagesContainer = this.$refs.messagesContainer
        messagesContainer.scrollTop = messagesContainer.scrollHeight
        this.onScroll()
      })
    },
    renderMarkdown(content) {
      if (content.startsWith('[')) {
        const text = JSON.parse(content)[0].text
        return MessageFormatter.renderMarkdown(text)
      }
      if (typeof content === 'string' && content !== '') {
        return MessageFormatter.renderMarkdown(content)
      }
    },
    isCodeBlock(content) {
      if (content == '') {
        return
      }
      if (content.startsWith('[')) {
        const text = JSON.parse(content)[0].text
        return MessageFormatter.isCodeBlock(text)
      }
      if (typeof content === 'string') {
        return MessageFormatter.isCodeBlock(content)
      }
    },
    sendMessage() {
      if (!this.isVerified) {
        this.$message.warn('请先验证密钥！')
        return
      }
      const trimmedMessage = this.userMessage.trim()
      if (trimmedMessage && WebSocketService.getReadyState()) {
        const activeSession = this.sessions.find((session) => session.id === this.activeSessionId)
        if (
          activeSession &&
          activeSession.name.startsWith('新会话') &&
          activeSession.messages.length === 0
        ) {
          activeSession.name = trimmedMessage.substring(0, 20)
        }
        // 保存用户发送的消息
        this.conversation.push({
          content: JSON.stringify([
            {
              type: 'text',
              text: trimmedMessage
            }
          ]),
          time: new Date(),
          role: 'user',
          imgUrl: null,
          done: true // 标记为完成
        })
        //  对话上下文只支持最近5次对话(固定首Prompt)
        const firstPrompt = this.conversation[0]
        const message = {
          sessionId: activeSession.id,
          action: 'session',
          file: null,
          conversation: [firstPrompt].concat(
            this.conversation.slice(-10).map((msg) => ({
              role: msg.role,
              content: msg.content
            }))
          )
        }
        if (this.uploadedFile) {
          this.uploadFile()
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64File = event.target.result
            message.file = base64File
            WebSocketService.sendMessage(JSON.stringify(message))
          }
          reader.readAsDataURL(this.uploadedFile)
        } else {
          WebSocketService.sendMessage(JSON.stringify(message))
        }
        this.base64Url = message.file
        this.userMessage = ''
        this.scrollToBottom()
        SessionService.save('chatSessions', this.sessions)
      }
    },
    loadActiveSession() {
      const activeSessionId = SessionService.get('activeSessionId')
      if (activeSessionId !== null) {
        this.activeSessionId = activeSessionId ? parseInt(activeSessionId, 10) : this.sessions[0].id
      }
    },
    setActiveSession(sessionId) {
      if (!this.isVerified) {
        return
      }
      // 保存上一个会话的消息到sessions
      const previousSession = SessionService.findSessionById(this.sessions, this.activeSessionId)
      if (previousSession) {
        previousSession.messages = [...this.conversation]
        SessionService.save('chatSessions', this.sessions)
      }

      // 重置累积消息
      this.currentAssistantMessage = ''

      // 更新当前会话为活跃会话
      this.activeSessionId = sessionId
      localStorage.setItem('activeSessionId', sessionId.toString())

      // 加载当前会话的消息
      const currentSession = this.sessions.find((session) => session.id === sessionId)
      if (currentSession) {
        this.conversation = [...currentSession.messages]
        //  将之前的消息继续生成完毕
        if (this.messageQueues[sessionId]) {
          this.messageQueues[sessionId].forEach((message) => {
            this.updateConversation(sessionId, message)
          })
          this.messageQueues[sessionId] = []
        }
      } else {
        this.conversation = []
      }

      if (this.messageQueues[sessionId]) {
        this.messageQueues[sessionId].forEach((message) => {
          this.updateConversation(sessionId, message)
        })
        this.messageQueues[sessionId] = []
      }
    },
    saveCurrentSessionMessages() {
      // 找到当前活动会话，并保存消息
      const currentSession = SessionService.findSessionById(this.sessions, this.activeSessionId)
      if (currentSession) {
        currentSession.messages = [...this.conversation]
      }
    },
    addNewSession() {
      if (!this.isVerified) {
        return
      }
      if (this.sessions.length >= 15) {
        this.$message.warn('最多只能创建10个新会话！')
        return
      }
      const sessionId = this.generateSessionId()
      // 直接创建一个新会话，不需要复制当前对话内容
      const newSession = SessionService.create(sessionId)
      this.sessions.push(newSession)
      this.initMessageQueueForSession(sessionId)
      SessionService.save('chatSessions', this.sessions)
    },
    loadActiveSessionMessages() {
      if (!this.isVerified) {
        return
      }
      const activeSession = SessionService.findSessionById(this.sessions, this.activeSessionId)
      if (activeSession) {
        this.conversation = [...activeSession.messages]
      } else {
        this.conversation = []
      }
    },
    deleteSession(sessionId) {
      if (sessionId === this.activeSessionId) {
        this.setActiveSession(1)
      }
      SessionService.delete(sessionId, this.sessions)
      this.$router.go(0)
    },
    clearConversation() {
      if (confirm('确定要清空上下文吗？')) {
        this.conversation = this.conversation.slice(0, 1) // 清空聊天数组
        const activeSession = this.sessions.find((session) => session.id === this.activeSessionId)
        if (activeSession) {
          activeSession.messages = [...this.conversation]
          SessionService.save('chatSessions', this.sessions)
        }
      }
    },
    handleWebSocketMessage(data) {
      const message = JSON.parse(data)
      if (message.content === 'success') {
        localStorage.setItem('isVerified', 'true')
        this.isVerified = true
        return
      }
      if (message.content === 'failure') {
        this.$message.error('密钥错误，请重新输入！！！')
        this.verificationKey = ''
        return
      }
      if (message.sessionId === 99999) {
        this.$message.error(message.content)
        return
      }
      //  将消息添加到对应会话的队列中
      if (this.messageQueues[message.sessionId]) {
        this.messageQueues[message.sessionId].push(message.content)
        if (message.sessionId === this.activeSessionId) {
          this.updateConversation(message.sessionId, message.content)
        }
      }
    },
    updateConversation(sessionId, data) {
      const activeSession = this.sessions.find((session) => session.id === sessionId)
      if (activeSession) {
        if (data === '[DONE]') {
          this.currentAssistantMessage = ''
        } else {
          // 实时更新累积的消息，且只更新当前活动会话的累积消息
          if (sessionId === this.activeSessionId) {
            this.currentAssistantMessage += data
          }
          // 然后更新到对话中以实时渲染，检查对话数组中最后一条消息是否属于助手且未完成
          if (
            this.conversation.length > 0 &&
            this.conversation[this.conversation.length - 1].role === 'assistant' &&
            !this.conversation[this.conversation.length - 1].done
          ) {
            // 更新最后一条消息的文本
            this.conversation[this.conversation.length - 1].content = JSON.stringify([
              { type: 'text', text: this.currentAssistantMessage }
            ])
          } else {
            // 否则，添加一个新的消息条目
            this.conversation.push({
              content: JSON.stringify([{ type: 'text', text: this.currentAssistantMessage }]),
              role: 'assistant',
              done: false
            })
          }
        }
        if (sessionId === this.activeSessionId) {
          // 由于数组中对象的属性发生了变化，确保更新视图
          activeSession.messages = [...this.conversation]
          SessionService.save('chatSessions', this.sessions)
          this.scrollToBottom()
        }
      }
    },
    updateConversationWithImageUrl(imgUrl) {
      // 用户的最后一条消息是当前上传的图片关联的
      const lastMessage = this.conversation[this.conversation.length - 1]
      if (lastMessage && lastMessage.role === 'user') {
        lastMessage.imgUrl = imgUrl
        this.conversation[this.conversation.length - 1] = lastMessage
        this.scrollToBottom()
      }
    },
    verifyKey() {
      if (this.verificationKey === '') {
        this.$message.warn('密钥不能为空！！！')
        return
      }
      const message = {
        action: 'verify',
        secretKey: this.verificationKey
      }
      WebSocketService.sendMessage(JSON.stringify(message))
    },
    formatTime(date) {
      if (!(date instanceof Date)) {
        date = new Date(date)
      }
      //  格式化时间戳
      return date.toLocaleTimeString()
    },
    handleFileUpload(file, fileList) {
      const isJPG = file.raw.type === 'image/jpeg'
      const isPNG = file.raw.type === 'image/png'
      const isLt256KB = file.raw.size / 1024 < 256 // 文件大小限制为256KB

      if (!isJPG && !isPNG) {
        this.$message.error('上传图片只能是 JPG/PNG 格式!')
        // 移除不符合条件的文件
        this.fileList = fileList.slice(0, fileList.length - 1)
        return false
      }
      if (!isLt256KB) {
        this.$message.error('上传图片大小不能超过 256KB!')
        // 移除不符合条件的文件
        this.fileList = fileList.slice(0, fileList.length - 1)
        return false
      }

      // 更新文件列表
      this.fileList = fileList
      this.uploadedFile = file.raw
    },
    uploadFile() {
      const fileName = this.uploadedFile.name
      console.log('file: ', this.uploadedFile)
      // const tokenUrl = `${process.env.TOKEN_URL}?fileName=${fileName}`
      const tokenUrl = 'http://127.0.0.1:3001/osstoken?filename=' + fileName

      fetch(tokenUrl).then(async (response) => {
        const { policy, signature, accessid, host, dir, stsToken, imgUrl } = await response.json()
        const formData = new FormData()
        formData.append('success_action_status', '200') // 指定成功上传时，服务端返回状态码200，默认返回204。
        formData.append('policy', policy)
        formData.append('signature', signature)
        formData.append('OSSAccessKeyId', accessid)
        if (stsToken) formData.append('x-oss-security-token', stsToken)

        formData.append('key', dir + fileName) // 文件名
        formData.append('file', this.uploadedFile) // file必须为最后一个表单域

        console.log(imgUrl)

        this.uploadedFileUrl = imgUrl

        const param = {
          method: 'POST',
          body: formData
        }
        fetch(host, param)
          .then((data) => {
            console.log(data)
            this.$message.success('上传成功！')
            this.updateConversationWithImageUrl(imgUrl)
            this.uploadedFile = null
            this.fileList = []
          })
          .catch((error) => {
            console.error('Error:', error)
          })
      })
    },
    handleUploadSuccess(response, file, fileList) {
      console.log('上传成功', response, file, fileList)
    },
    handleUploadError(error, file, fileList) {
      console.error('上传失败', error, file, fileList)
    },
    generateSessionId() {
      const currentTimestampInMs = Date.now()
      const salt = Math.random()
      const timestampWithSalt = Math.floor(currentTimestampInMs + salt)
      return timestampWithSalt
    }
  },
  mounted() {
    const messagesContainer = this.$refs.messagesContainer
    messagesContainer.addEventListener('scroll', this.onScroll)
    this.scrollToBottom()
  },
  beforeUnmount() {
    const messagesContainer = this.$refs.messagesContainer
    messagesContainer.removeEventListener('scroll', this.onScroll)
    WebSocketService.unregisterMessageHandler(this.handleWebSocketMessage)
    //  组件被销毁前关闭 WebSocket 连接
    WebSocketService.closeWebSocket()
  }
}
</script>

<template>
  <div class="chat-page">
    <SidebarView
      :sessions="sessions"
      :active-session-id="activeSessionId"
      @set-active-session="setActiveSession"
      @add-new-session="addNewSession"
      @delete-session="deleteSession"
    />
    <div class="chat-container">
      <div class="greeting" v-if="!conversation.length && isVerified">
        您好！有什么可以帮助你的吗？
      </div>
      <div v-if="!isVerified" class="verification-area">
        <el-input v-model="verificationKey" placeholder="请输入密钥进行验证"></el-input>
        <el-button type="primary" @click="verifyKey">验证</el-button>
      </div>
      <div class="messages" ref="messagesContainer">
        <div v-for="(msg, index) in conversation" :key="index" :class="['message', msg.role]">
          <i
            :class="['icon', msg.role === 'user' ? 'fa-solid fa-user-tie' : 'fa-solid fa-robot']"
          ></i>
          <div v-if="msg.imgUrl" class="image-container">
            <img :src="msg.imgUrl" alt="Uploaded Image" />
          </div>
          <div class="text" v-html="renderMarkdown(msg.content)"></div>
          <div class="timestamp" v-if="msg.role === 'user'">{{ formatTime(msg.time) }}</div>
        </div>
        <el-button
          type="primary"
          v-show="showScrollButton"
          class="scroll-to-bottom"
          style="font-size: 24px"
          icon="Bottom"
          @click="scrollToBottom"
        />
      </div>
      <div v-if="isVerified">
        <div class="input-area">
          <el-tooltip content="上传文件" placement="top">
            <el-upload
              class="upload-file"
              action="/"
              :on-change="handleFileUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :file-list="fileList"
              list-type="picture"
              :auto-upload="false"
            >
              <template #trigger>
                <el-button
                  class="file-upload-icon"
                  style="font-size: 24px"
                  icon="UploadFilled"
                  type="primary"
                ></el-button>
              </template>
            </el-upload>
          </el-tooltip>
          <el-input
            type="textarea"
            class="message-textarea"
            v-model="userMessage"
            @keyup.enter="sendMessage"
            placeholder="请输入文本"
            style="width: 40%"
            autosize
          />
          <el-button
            type="success"
            icon="Promotion"
            @click="sendMessage"
            class="send-button"
            style="font-size: 24px"
            :disabled="!userMessage.trim() && !uploadedFile"
          />
          <el-tooltip content="清空上下文" placement="top">
            <el-button
              style="font-size: 24px"
              type="primary"
              class="clear-conversation"
              icon="Delete"
              @click="clearConversation"
            />
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../styles/chat.css"></style>
