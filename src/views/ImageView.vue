<script setup>
import { ref, onMounted, watch } from 'vue'
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

onMounted(async () => {
  // webSocketService.initializeWebSocket('ws://localhost:8809/ws')
  webSocketService.initializeWebSocket(`${process.env.VITE_APP_WEBSOCKET_END_POINT}/image/ws`)
  webSocketService.registerMessageHandler(handleWebSocketMessage)
  const sessionsFromStorage = sessionService.get('imageSessions')
  if (sessionsFromStorage) {
    conversation.value = JSON.parse(sessionsFromStorage)
  }
})

watch(
  conversation,
  () => {
    debouncedSave()
  },
  { deep: true }
)

const isVerified = sessionService.get('isVerified') === 'true'
const generateImage = async () => {
  if (!isVerified) {
    ElMessage.warn('请先验证密钥！')
    return
  }
  const trimmedMessage = userMessage.value.trim()
  if (trimmedMessage && webSocketService.getReadyState()) {
    conversation.value.push({
      text: trimmedMessage,
      time: new Date(),
      role: 'user',
      done: true
    })
    conversation.value.push({
      text: '正在生成图像，请稍候...',
      role: 'assistant',
      done: false
    })

    let conversationContent = {}
    if (conversation.value.length >= 2) {
      const penultimateConversation = conversation.value[conversation.value.length - 2]
      conversationContent = {
        content: penultimateConversation.text
      }
    }
    const message = {
      action: 'session',
      conversation: conversationContent
    }
    webSocketService.sendMessage(JSON.stringify(message))
  }
  userMessage.value = ''
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
      // 文本消息处理
      currentAssistantMessage.value += messageObj.content
      updateConversation()
    }
  } else if (messageObj.type === 'errMsg') {
    ElMessage.error(messageObj.content)
  }
}

const updateConversationWithImage = () => {
  if (conversation.value.length > 0) {
    conversation.value[conversation.value.length - 1].imageUrl = imgUrl.value
    conversation.value[conversation.value.length - 1].done = true
    imgUrl.value = ''
  }
}

const updateConversation = () => {
  if (conversation.value.length > 0) {
    // 更新最后一条消息
    const assistantMessages = conversation.value.filter((msg) => msg.role === 'assistant')
    assistantMessages[assistantMessages.length - 1].text = currentAssistantMessage.value
  } else {
    // 添加新的消息
    conversation.value.push({
      text: currentAssistantMessage.value,
      imageUrl: imgUrl.value,
      time: new Date(),
      role: 'assistant',
      done: false
    })
    imgUrl.value = ''
  }
  sessions.value = conversation.value
}

const markLastMessageAsDone = () => {
  if (conversation.value.length > 0) {
    conversation.value[conversation.value.length - 1].done = true
  }
}

const debouncedSave = debounce(() => {
  // 防抖（Debounce）函数
  // 防抖技术可以确保在一定时间内，无论发生多少次更新，只有最后一次操作后的一段时间才会触发函数执行。
  sessionService.save('imageSessions', conversation.value)
}, 500)

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
