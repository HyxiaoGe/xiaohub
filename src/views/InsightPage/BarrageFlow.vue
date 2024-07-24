<template>
  <div class="barrage-flow">
    <div
      v-for="(message, index) in activeMessages"
      :key="message.id"
      class="barrage-message"
      :style="{ top: `${index * 20}px` }"
    >
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const activeMessages = ref([])
let messageIndex = 0 // 当前消息的索引

function addMessage() {
  if (props.data && props.data.length > 0) {
    const newMessage = {
      id: Date.now(),
      text: props.data[messageIndex % props.data.length]
    }
    activeMessages.value = [newMessage] // 每次只显示一条消息
    messageIndex++ // 移动到下一条消息
  }
}

onMounted(() => {
  addMessage()
  setInterval(() => {
    addMessage()
  }, 20000) // 每20秒更换一条消息
})

watch(
  () => props.data,
  () => {
    messageIndex = 0
    activeMessages.value = []
    addMessage()
  }
)
</script>

<style>
.barrage-flow {
  width: 100%;
  height: 30px; /* 只显示一行 */
  overflow: hidden;
  position: relative;
  background-color: #eee;
}
.barrage-message {
  display: block;
  position: absolute;
  right: 0;
  white-space: nowrap;
  animation: scroll 20s linear; /* 设置动画时间 */
}
@keyframes scroll {
  from {
    transform: translateX(100vw); /* 从屏幕右侧开始 */
  }
  to {
    transform: translateX(-100vw); /* 滚动到屏幕左侧结束 */
  }
}
</style>
