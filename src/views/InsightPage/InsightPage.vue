<script setup>
import { ref, onMounted } from 'vue'
import BarrageFlow from './BarrageFlow.vue'
import AINew from './AINew.vue'
import CategoryNav from './CategoryNav.vue'
// import SearchBar from './SearchBar.vue'
import InsightService from '@/services/InsightService'
import webSocketService from '@/services/WebSocketService'

const insightData = ref({
  barrageFlowData: null,
  aiNewData: null,
  categoryNavData: null
})

const fetchAINewData = async () => {
  const cachedAINewData = localStorage.getItem('AINewData')
  if (cachedAINewData) {
    const parseAINewData = JSON.parse(cachedAINewData)
    insightData.value.aiNewData = { ...parseAINewData }
  } else {
    try {
      const response = await InsightService.get36KrAIData()
      // insightData.value.barrageFlowData = response.data.map((it) => it.title)
      const aggregatedData = {
        KR_36_AINews: response.data
      }
      insightData.value.aiNewData = aggregatedData
      localStorage.setItem('AINewData', JSON.stringify(insightData.value.aiNewData))
    } catch (error) {
      console.error('Error fetching insight data:', error)
    }
  }
}

const fetchCategoryNavData = async () => {
  const cachedCategoryData = localStorage.getItem('CategoryNavData')
  if (cachedCategoryData) {
    const parseCategoryNavData = JSON.parse(cachedCategoryData)
    insightData.value.categoryNavData = { ...parseCategoryNavData }
  } else {
    try {
      const xpin_response = await InsightService.getChaPingData()
      const ali_response = await InsightService.getAliResearchData()
      xpin_response.data.forEach((item) => (item.source = 'X'))
      ali_response.data.forEach((item) => (item.source = 'ali'))
      const data = []
      data.push({ title: '暂无内容' })
      const aggregatedData = {
        Facts: xpin_response.data,
        Technology: ali_response.data,
        AI: data,
        Finance: data,
        News: data,
        Life: data,
        Youtube: data,
        X: data
      }
      console.log(aggregatedData)
      insightData.value.categoryNavData = aggregatedData
      localStorage.setItem('CategoryNavData', JSON.stringify(insightData.value.categoryNavData))
    } catch (error) {
      console.error('Error fetching category nav data:', error)
    }
  }
}

const handleWebSocketMessage = (message) => {
  try {
    if (message) {
      const messageObj = JSON.parse(message)
      if (messageObj.type === 'update') {
        console.log('received message')
        const platform = messageObj.content
        if (platform === '36kr') {
          localStorage.removeItem('AINewData')
        } else if (platform === 'chaping' || platform === 'aliresearch') {
          localStorage.removeItem('CategoryNavData')
        }
      }
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error)
  }
}

onMounted(async () => {
  try {
    await fetchAINewData()
    await fetchCategoryNavData()
    // webSocketService.initializeWebSocket('ws://localhost:8810/ws')
    webSocketService.initializeWebSocket(`${process.env.VITE_APP_WEBSOCKET_END_POINT}/insight/ws`)
    webSocketService.registerMessageHandler(handleWebSocketMessage)
  } catch (error) {
    console.error('Error during component initialization:', error)
  }
})
</script>

<template>
  <div class="insight-page">
    <BarrageFlow
      class="barrage-flow"
      v-if="insightData.barrageFlowData"
      :data="insightData.barrageFlowData"
    />
    <!-- <SearchBar class="search-bar" /> -->
    <div class="main-content">
      <CategoryNav
        class="category"
        v-if="insightData.categoryNavData"
        :data="insightData.categoryNavData"
      />
      <div class="side-content">
        <AINew class="ai-new" v-if="insightData.aiNewData" :data="insightData.aiNewData" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.insight-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.barrage-flow {
  width: 100%;
  background-color: #f5f5f5;
  margin-bottom: 20px;
}

.search-bar {
  width: 30%;
  margin-top: 20px;
  display: flex;
  justify-content: center;
  margin-right: 400px;
}

.main-content {
  display: flex;
  justify-content: space-between;
  width: 80%;
  margin-top: 20px;
}

.category {
  flex: 3;
  margin-right: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.side-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.ai-new {
  flex: 1;
}
</style>
