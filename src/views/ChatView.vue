<script setup>
import { ref, onMounted, onBeforeMount, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SidebarView from './SidebarView.vue'
import WebSocketService from '@/services/WebSocketService'
import SessionService from '@/services/SessionService'
import MessageFormatter from '@/services/MessageFormatter'
import Assistants from '@/common/Assistant'

const router = useRouter()

const userMessage = ref('')
const conversation = ref([])
const currentAssistantMessage = ref('')
const verificationKey = ref('')
const messagesContainer = ref(null)
const showScrollButton = ref(false)
const isVerified = ref(true)
const sessions = ref([
  Assistants.smartAssistant,
  Assistants.programmingAssistant,
  Assistants.memeExpert,
  Assistants.languageAssistant,
  Assistants.encyclopedia
])
const activeSessionId = ref(1)
const uploadedFile = ref(null)
const uploadedFileUrl = ref('')
const base64Url = ref(null)
const messageQueues = ref({})
const fileList = ref([])

const WEBSOCKET_URL = `${process.env.VITE_APP_WEBSOCKET_END_POINT}/chat/ws`

onBeforeMount(() => {
  WebSocketService.initializeWebSocket(WEBSOCKET_URL)
  WebSocketService.registerMessageHandler(handleWebSocketMessage)
  loadActiveSession()
  initializeQueues()
  loadSessionsFromLocalStorage()
})

onMounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', onScroll)
    scrollToBottom()
  }
})

onBeforeUnmount(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', onScroll)
  }
  WebSocketService.unregisterMessageHandler(handleWebSocketMessage)
})

const loadSessionsFromLocalStorage = () => {
  const savedSessions = SessionService.get('chatSessions')
  if (savedSessions) {
    sessions.value = JSON.parse(savedSessions)
  }
  loadActiveSessionMessages()
}

const initializeQueues = () => {
  sessions.value.forEach((session) => {
    initMessageQueueForSession(session.id)
  })
}

const initMessageQueueForSession = (sessionId) => {
  messageQueues.value[sessionId] = []
}

const onScroll = () => {
  if (messagesContainer.value) {
    const nearBottom =
      messagesContainer.value.scrollHeight -
        messagesContainer.value.scrollTop -
        messagesContainer.value.clientHeight <
      10
    showScrollButton.value = !nearBottom
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const renderMarkdown = (content) => {
  if (content.startsWith('[')) {
    const text = JSON.parse(content)[0].text
    return MessageFormatter.renderMarkdown(text)
  }
  if (typeof content === 'string' && content !== '') {
    return MessageFormatter.renderMarkdown(content)
  }
}

const sendMessage = () => {
  if (!isVerified.value) {
    ElMessage.warn('请先验证密钥！')
    return
  }
  const trimmedMessage = userMessage.value.trim()
  if (trimmedMessage && WebSocketService.getReadyState()) {
    const activeSession = sessions.value.find((session) => session.id === activeSessionId.value)
    if (
      activeSession &&
      activeSession.name.startsWith('新会话') &&
      activeSession.messages.length === 0
    ) {
      activeSession.name = trimmedMessage.substring(0, 20)
    }
    addMessageToConversation(trimmedMessage, 'user', true)
    const firstPrompt = conversation.value[0]
    const message = {
      sessionId: activeSession.id,
      action: 'session',
      file: null,
      conversation: [firstPrompt].concat(
        conversation.value.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content
        }))
      )
    }
    if (uploadedFile.value) {
      uploadFile(message)
    } else {
      WebSocketService.sendMessage(JSON.stringify(message))
    }
    base64Url.value = message.file
    userMessage.value = ''
    scrollToBottom()
    SessionService.save('chatSessions', sessions.value)
  }
}

const addMessageToConversation = (content, role, done) => {
  conversation.value.push({
    content: JSON.stringify([{ type: 'text', text: content }]),
    time: new Date(),
    role,
    imgUrl: null,
    done
  })
}

const loadActiveSession = () => {
  const currentSessionId = SessionService.get('activeSessionId')
  if (currentSessionId !== null) {
    activeSessionId.value = currentSessionId ? parseInt(currentSessionId, 10) : sessions.value[0].id
  }
}

const setActiveSession = (sessionId) => {
  if (!isVerified.value) {
    return
  }
  saveCurrentSessionMessages()
  currentAssistantMessage.value = ''
  activeSessionId.value = sessionId
  localStorage.setItem('activeSessionId', sessionId.toString())
  loadCurrentSessionMessages(sessionId)
}

const saveCurrentSessionMessages = () => {
  const previousSession = SessionService.findSessionById(sessions.value, activeSessionId.value)
  if (previousSession) {
    previousSession.messages = [...conversation.value]
    SessionService.save('chatSessions', sessions.value)
  }
}

const loadCurrentSessionMessages = (sessionId) => {
  const currentSession = sessions.value.find((session) => session.id === sessionId)
  if (currentSession) {
    conversation.value = [...currentSession.messages]
    processMessageQueue(sessionId)
  } else {
    conversation.value = []
  }
}

const processMessageQueue = (sessionId) => {
  if (messageQueues.value[sessionId]) {
    messageQueues.value[sessionId].forEach((message) => {
      updateConversation(sessionId, message)
    })
    messageQueues.value[sessionId] = []
  }
}

const addNewSession = () => {
  if (!isVerified.value) {
    return
  }
  if (sessions.value.length >= 15) {
    ElMessage.warn('最多只能创建10个新会话！')
    return
  }
  const sessionId = generateSessionId()
  const newSession = SessionService.create(sessionId)
  sessions.value.push(newSession)
  initMessageQueueForSession(sessionId)
  SessionService.save('chatSessions', sessions.value)
}

const loadActiveSessionMessages = () => {
  if (!isVerified.value) {
    return
  }
  const activeSession = SessionService.findSessionById(sessions.value, activeSessionId.value)
  if (activeSession) {
    conversation.value = [...activeSession.messages]
  } else {
    conversation.value = []
  }
}

const deleteSession = (sessionId) => {
  if (sessionId === activeSessionId.value) {
    setActiveSession(1)
  }
  SessionService.delete('chatSessions', sessionId, sessions.value)
  router.go(0)
}

const clearConversation = () => {
  if (confirm('确定要清空上下文吗？')) {
    conversation.value = conversation.value.slice(0, 1)
    saveCurrentSessionMessages()
  }
}

const handleWebSocketMessage = (data) => {
  const message = JSON.parse(data)
  if (message.content === 'success') {
    localStorage.setItem('isVerified', 'true')
    isVerified.value = true
    return
  }
  if (message.content === 'failure') {
    ElMessage.error('密钥错误，请重新输入！！！')
    verificationKey.value = ''
    return
  }
  if (message.sessionId === 99999) {
    ElMessage.error(message.content)
    return
  }
  if (messageQueues.value[message.sessionId]) {
    messageQueues.value[message.sessionId].push(message.content)
    if (message.sessionId === activeSessionId.value) {
      updateConversation(message.sessionId, message.content)
    }
  }
}

const updateConversation = (sessionId, data) => {
  const activeSession = sessions.value.find((session) => session.id === sessionId)
  if (activeSession) {
    if (data === '[DONE]') {
      currentAssistantMessage.value = ''
    } else {
      if (sessionId === activeSessionId.value) {
        currentAssistantMessage.value += data
      }
      if (
        conversation.value.length > 0 &&
        conversation.value[conversation.value.length - 1].role === 'assistant' &&
        !conversation.value[conversation.value.length - 1].done
      ) {
        conversation.value[conversation.value.length - 1].content = JSON.stringify([
          { type: 'text', text: currentAssistantMessage.value }
        ])
      } else {
        conversation.value.push({
          content: JSON.stringify([{ type: 'text', text: currentAssistantMessage.value }]),
          role: 'assistant',
          done: false
        })
      }
    }
    if (sessionId === activeSessionId.value) {
      activeSession.messages = [...conversation.value]
      SessionService.save('chatSessions', sessions.value)
      scrollToBottom()
    }
  }
}

const updateConversationWithImageUrl = (imgUrl) => {
  const lastMessage = conversation.value[conversation.value.length - 1]
  if (lastMessage && lastMessage.role === 'user') {
    lastMessage.imgUrl = imgUrl
    conversation.value[conversation.value.length - 1] = lastMessage
    scrollToBottom()
  }
}

const verifyKey = () => {
  if (verificationKey.value === '') {
    ElMessage.warn('密钥不能为空！！！')
    return
  }
  const message = {
    action: 'verify',
    secretKey: verificationKey.value
  }
  WebSocketService.sendMessage(JSON.stringify(message))
}

const formatTime = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return date.toLocaleTimeString()
}

const handleFileUpload = (file, fileList) => {
  const isJPG = file.raw.type === 'image/jpeg'
  const isPNG = file.raw.type === 'image/png'
  const isLt256KB = file.raw.size / 1024 < 256

  if (!isJPG && !isPNG) {
    ElMessage.error('上传图片只能是 JPG/PNG 格式!')
    fileList.value = fileList.slice(0, fileList.length - 1)
    return false
  }
  if (!isLt256KB) {
    ElMessage.error('上传图片大小不能超过 256KB!')
    fileList.value = fileList.slice(0, fileList.length - 1)
    return false
  }

  fileList.value = fileList
  uploadedFile.value = file.raw
}

const uploadFile = (message) => {
  const fileName = uploadedFile.value.name
  const tokenUrl = `http://${process.env.VITE_APP_END_POINT}/osstoken?filename=${fileName}`
  fetch(tokenUrl).then(async (response) => {
    const { policy, signature, accessid, host, dir, stsToken, imgUrl } = await response.json()

    const formData = new FormData()
    formData.append('success_action_status', '200')
    formData.append('policy', policy)
    formData.append('signature', signature)
    formData.append('OSSAccessKeyId', accessid)
    if (stsToken) formData.append('x-oss-security-token', stsToken)
    formData.append('key', dir + fileName)
    formData.append('file', uploadedFile.value)

    uploadedFileUrl.value = imgUrl

    const param = {
      method: 'POST',
      body: formData
    }
    fetch(host, param)
      .then(() => {
        updateConversationWithImageUrl(imgUrl)
        uploadedFile.value = null
        fileList.value = []
        WebSocketService.sendMessage(JSON.stringify(message))
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  })
}

const handleUploadSuccess = (response, file, fileList) => {
  console.log('上传成功', response, file, fileList)
}

const handleUploadError = (error, file, fileList) => {
  console.error('上传失败', error, file, fileList)
}

const generateSessionId = () => {
  const currentTimestampInMs = Date.now()
  const salt = Math.random()
  const timestampWithSalt = Math.floor(currentTimestampInMs + salt)
  return timestampWithSalt
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
