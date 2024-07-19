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
import { ref, onMounted } from 'vue'

const messages = [
  "Nvidia和Mistral推出的新模型'Mistral-NeMo', 将企业级AI带到桌面电脑上。",
  '研究人员创造了模仿皮肤的感应机器人，用于提供医疗治疗',
  '使用AI来解码狗的叫声',
  '新模型允许计算机理解人类情感',
  'AI在监控仇恨言论中拯救人类免受情感伤害',
  '在未来，AI工具将能够完成更复杂的任务',
  '基础模型透明度指数评估了10家公司的AI模型透明度',
  '谷歌AI可能拯救澳大利亚的巨型海带林',
  'Nvidia因AI热潮而利润增长580%',
  '年轻人正在向ChatGPT寻求约会建议'
]
const activeMessages = ref([])

let messageIndex = 0 // 当前消息的索引

function addMessage() {
  const newMessage = {
    id: Date.now(), // 唯一标识，确保每条消息都是新的DOM节点
    text: messages[messageIndex % messages.length] // 确保按顺序获取消息
  }
  activeMessages.value = [newMessage] // 每次只显示一条消息
  messageIndex++ // 移动到下一条消息
}

onMounted(() => {
  setInterval(() => {
    addMessage()
  }, 20000) // 每20秒更换一条消息
})
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
