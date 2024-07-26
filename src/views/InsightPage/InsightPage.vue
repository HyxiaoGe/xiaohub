<script setup>
import { ref, onMounted } from 'vue'
import BarrageFlow from './BarrageFlow.vue'
import AINew from './AINew.vue'
import CategoryNav from './CategoryNav.vue'
import SearchBar from './SearchBar.vue'
import InsightService from '@/services/InsightService'

const insightData = ref({
  barrageFlowData: null,
  aiNewData: null,
  categoryNavData: null
})

const fetchAINewData = async () => {
  const cacheKey = 'AINewData'
  const cachedData = localStorage.getItem(cacheKey)
  if (cachedData) {
    const parseData = JSON.parse(cachedData)
    insightData.value.aiNewData = { ...parseData }
  } else {
    try {
      const response = await InsightService.get36KrAIData()
      insightData.value.barrageFlowData = response.data.map((it) => it.title)
      const aggregatedData = {
        KR_36_AINews: response.data
      }
      insightData.value.aiNewData = aggregatedData
      localStorage.setItem(cacheKey, JSON.stringify(insightData.value.aiNewData))
    } catch (error) {
      console.error('Error fetching insight data:', error)
    }
  }
}

const fetchCategoryNavData = async () => {
  const cacheKey = 'CategoryNavData'
  const cachedData = localStorage.getItem(cacheKey)
  if (cachedData) {
    const parseData = JSON.parse(cachedData)
    insightData.value.categoryNavData = { ...parseData }
  } else {
    try {
      const x_response = await InsightService.getChaPingData()
      const ali_response = await InsightService.getAliResearchData()
      x_response.data.forEach((item) => (item.source = 'X'))
      ali_response.data.forEach((item) => (item.source = 'ali'))
      const aggregatedData = {
        Facts: x_response.data,
        Technology: ali_response.data
      }
      insightData.value.categoryNavData = aggregatedData
      localStorage.setItem(cacheKey, JSON.stringify(insightData.value.categoryNavData))
    } catch (error) {
      console.error('Error fetching category nav data:', error)
    }
  }
}

onMounted(async () => {
  fetchAINewData()
  await fetchCategoryNavData()
})
</script>

<template>
  <div class="insight-page">
    <BarrageFlow
      class="barrage-flow"
      v-if="insightData.barrageFlowData"
      :data="insightData.barrageFlowData"
    />
    <SearchBar class="search-bar" />
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
