<script setup>
import { ref, onMounted } from 'vue'
import BarrageFlow from './BarrageFlow.vue'
import BannerPost from './BannerPost.vue'
import AINew from './AINew.vue'
// import AIHot from './AIHot.vue'
import SearchBar from './SearchBar.vue'
import InsightService from '@/services/InsightService'

const insightData = ref({
  barrageFlowData: null,
  bannerPostData: null,
  aiNewData: null,
  aiHotData: null
})

const fetchInsightData = async () => {
  const cacheKey = 'insightData'
  const cachedData = localStorage.getItem(cacheKey)
  if (cachedData) {
    const parseData = JSON.parse(cachedData)
    insightData.value = { ...parseData }
    console.log('Insight data loaded from cache:')
  } else {
    console.log('fetchInsightData called')
    try {
      const response = await InsightService.getInsightData()
      const articles = response.data
      insightData.value.barrageFlowData = articles.map((it) => it.title)
      insightData.value.aiHotData = articles
      insightData.value.aiNewData = articles
      localStorage.setItem(cacheKey, JSON.stringify(insightData.value))
      console.log('Insight data:', response.data)
    } catch (error) {
      console.error('Error fetching insight data:', error)
    }
  }
}

onMounted(() => {
  fetchInsightData()
})
</script>

<template>
  <div class="insight-page">
    <BarrageFlow
      class="barrage-flow"
      v-if="insightData.barrageFlowData"
      :data="insightData.barrageFlowData"
    />
    <div class="main-content">
      <BannerPost class="banner-post" />
      <div class="side-content">
        <AINew class="ai-new" v-if="insightData.aiNewData" :data="insightData.aiNewData" />
        <!-- <AIHot class="ai-hot" :data="insightData.aiHotData" /> -->
      </div>
    </div>
    <SearchBar class="search-bar" />
  </div>
</template>

<style>
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

.main-content {
  display: flex;
  justify-content: space-between;
  width: 80%;
  margin-top: 20px;
}

.banner-post {
  flex: 3;
  margin-right: 20px;
}

.side-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.ai-hot,
.ai-new {
  margin-bottom: 20px;
  flex: 1;
}

.search-bar {
  width: 80%;
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
