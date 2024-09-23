<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { debounce } from 'lodash'
import { ElMessage } from 'element-plus'
import sessionService from '@/services/SessionService'
import webSocketService from '@/services/WebSocketService'

const verificationKey = ref('')
const sessions = ref([])
const conversation = ref([])
const userMessage = ref('')
const currentAssistantMessage = ref('')
const imgUrl = ref('')
const showScrollButton = ref(false)
const messagesContainer = ref(null)

const WEBSOCKET_URL = `${process.env.VITE_APP_WEBSOCKET_END_POINT}/image/ws`
const DEBOUNCE_DELAY = 500

onMounted(async () => {
  webSocketService.initializeWebSocket(WEBSOCKET_URL)
  webSocketService.registerMessageHandler(handleWebSocketMessage)
  const sessionsFromStorage = sessionService.get('imageSessions')
  if (sessionsFromStorage) {
    conversation.value = JSON.parse(sessionsFromStorage)
  }
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', onScroll)
    scrollToBottom()
  }
})

onBeforeUnmount(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', onScroll)
  }
  webSocketService.unregisterMessageHandler(handleWebSocketMessage)
})

watch(conversation, debouncedSave, { deep: true })

const isVerified = 'true'
const generateImage = async () => {
  if (!isVerified) {
    ElMessage.warn('请先验证密钥！')
    return
  }
  const trimmedMessage = userMessage.value.trim()
  if (trimmedMessage && webSocketService.getReadyState()) {
    addMessage(trimmedMessage, 'user', true)
    addMessage('正在生成图像，请稍候...', 'assistant', false)

    const conversationContent =
      conversation.value.length >= 2
        ? { content: conversation.value[conversation.value.length - 2].text }
        : {}

    const message = {
      action: 'session',
      conversation: conversationContent
    }
    webSocketService.sendMessage(JSON.stringify(message))
  }
  userMessage.value = ''
  scrollToBottom()
}

const handleWebSocketMessage = (message) => {
  const messageObj = JSON.parse(message)
  if (messageObj.type === 'image') {
    imgUrl.value = messageObj.content
    updateConversationWithImage()
  } else if (messageObj.type === 'text') {
    if (messageObj.content === '[DONE]') {
      markLastMessageAsDone()
      currentAssistantMessage.value = ''
      imgUrl.value = ''
    } else {
      currentAssistantMessage.value += messageObj.content
      updateConversation()
      scrollToBottom()
    }
  } else if (messageObj.type === 'errMsg') {
    ElMessage.error(messageObj.content)
  }
}

const addMessage = (text, role, done) => {
  conversation.value.push({
    text,
    time: new Date(),
    role,
    done
  })
}

const updateConversationWithImage = () => {
  if (conversation.value.length > 0) {
    const lastMessage = conversation.value[conversation.value.length - 1]
    lastMessage.imageUrl = imgUrl.value
    lastMessage.done = true
    imgUrl.value = ''
    scrollToBottom()
  }
}

const updateConversation = () => {
  if (conversation.value.length > 0) {
    const assistantMessages = conversation.value.filter((msg) => msg.role === 'assistant')
    assistantMessages[assistantMessages.length - 1].text = currentAssistantMessage.value
  } else {
    addMessage(currentAssistantMessage.value, 'assistant', false)
    imgUrl.value = ''
  }
  sessions.value = conversation.value
  scrollToBottom()
}

const markLastMessageAsDone = () => {
  if (conversation.value.length > 0) {
    conversation.value[conversation.value.length - 1].done = true
    scrollToBottom()
  }
}

const debouncedSave = debounce(() => {
  sessionService.save('imageSessions', conversation.value)
}, DEBOUNCE_DELAY)

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

const clearConversation = () => {
  if (confirm('确定要清空上下文吗？')) {
    conversation.value = []
  }
}
</script>

<template>
  <div class="chat-page">
    <div class="chat-container">
      <div v-if="!isVerified" class="verification-area">
        <el-input v-model="verificationKey" placeholder="请输入密钥进行验证"></el-input>
        <el-button type="primary" @click="verifyKey">验证</el-button>
      </div>
      <div class="messages" ref="messagesContainer">
        <div v-for="(msg, index) in conversation" :key="index" :class="['message', msg.role]">
          <i
            :class="['icon', msg.role === 'user' ? 'fa-solid fa-user-tie' : 'fa-solid fa-robot']"
          ></i>
          <div
            v-if="msg.text"
            :class="['icon', msg.role === 'user' ? 'user-text-content' : 'robot-text-content']"
            v-text="msg.text"
          ></div>
          <img v-if="msg.imageUrl" :src="msg.imageUrl" alt="Generate image" class="message-image" />
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
          <el-input
            type="textarea"
            class="message-textarea"
            v-model="userMessage"
            @keyup.enter="generateImage"
            placeholder="请输入文本"
            style="width: 40%"
            autosize
          />
          <el-button
            type="success"
            icon="Promotion"
            class="send-button"
            style="font-size: 24px"
            @click="generateImage"
            :disabled="!userMessage.trim()"
          />
          <el-tooltip content="清空上下文" placement="top">
            <el-button
              style="font-size: 24px"
              type="primary"
              class="clear-conversation"
              @click="clearConversation"
              icon="Delete"
            />
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../styles/image.css"></style>
