<script setup>
import { ref, onMounted  } from 'vue';
import { ElMessage } from 'element-plus';
import sessionService from '@/services/SessionService';
import webSocketService from '@/services/WebSocketService';

const verificationKey = ref('');
const conversation = ref([]);
const userMessage = ref('');

onMounted(() => {
  webSocketService.initializeWebSocket('ws://localhost:8808/ws');
});

const isVerified = sessionService.get('isVerified') === 'true'
const generateImage = async () => {
      if (!isVerified) {
        ElMessage.warn('请先验证密钥！')
        return
      }
      const trimmedMessage = userMessage.value.trim()
      if (trimmedMessage && webSocketService.getReadyState()) { 
        console.log('trimmedMessage: ', trimmedMessage)
        conversation.value.push({
          content: JSON.stringify([
            {
              type: 'text',
              text: trimmedMessage
            }
          ]),
          time: new Date(),
          role: 'user',
          done: true
        })
      const message = {
        action: 'session',
        conversation: 
          conversation.value.slice(-10).map((msg) => ({
            role: msg.role,
            content: msg.content
          }))
      }
      webSocketService.sendMessage(JSON.stringify(message))
    }
};
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
          <i :class="['icon', msg.role === 'user' ? 'fa-solid fa-user-tie' : 'fa-solid fa-robot']"></i>
          <div
            class="code-block"
            v-text=msg.content></div>
          <div class="timestamp" v-if="msg.role === 'user'">{{ msg.time }}</div>
        </div>
      </div>
      <div v-if="isVerified">
        <div class="input-area">
          <el-input
            type="textarea"
            class="message-textarea"
            v-model="userMessage"
            placeholder="请输入文本"
            style="width: 40%"
            autosize/>
          <el-button
            type="success"
            icon="Promotion"
            class="send-button"
            style="font-size: 24px"
            @click="generateImage"
            :disabled="!userMessage.trim()"/>
          <el-tooltip content="清空上下文" placement="top">
            <el-button
              style="font-size: 24px"
              type="primary"
              class="clear-conversation"
              icon="Delete"/>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../styles/draw.css"></style>
