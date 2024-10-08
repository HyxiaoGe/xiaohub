<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import BarrageFlow from './BarrageFlow.vue'
import AINew from './AINew.vue'
import CategoryNav from './CategoryNav.vue'
import SearchBar from './SearchBar.vue'
import InsightService from '@/services/InsightService'
import { ElMessageBox } from 'element-plus'

const insightData = ref({
  barrageFlowData: null,
  aiNewData: null,
  categoryNavData: null
})

const platforms = ref(['zaobao', 'chlinlearn', 'oeeee', 'deeplearning'])

const timer = ref(null)

const fetchAINewData = async () => {
  const cachedAINewData = localStorage.getItem('AINewData')
  if (cachedAINewData) {
    insightData.value.aiNewData = JSON.parse(cachedAINewData)
  } else {
    try {
      const { data } = await InsightService.getPlatformData('36kr')
      const aggregatedData = { KR_36_AINews: data }
      insightData.value.aiNewData = aggregatedData
      localStorage.setItem('AINewData', JSON.stringify(aggregatedData))
    } catch (error) {
      console.error('Error fetching insight data:', error)
    }
  }
}

const fetchCategoryNavData = async () => {
  const cachedCategoryData = localStorage.getItem('CategoryNavData')
  if (cachedCategoryData) {
    insightData.value.categoryNavData = JSON.parse(cachedCategoryData)
    return
  }

  try {
    const responses = await Promise.all(
      platforms.value.map((platform) => InsightService.getPlatformData(platform))
    )

    const defaultData = { title: '暂无内容' }

    const aggregatedData = {
      Facts: responses[0].data,
      Technology: responses[1].data,
      Life: responses[2].data,
      AI: responses[3].data,
      Youtube: [defaultData],
      X: [defaultData]
    }

    responses.forEach((response, index) => {
      response.data.forEach((item) => {
        item.source = platforms[index]
      })
    })

    insightData.value.categoryNavData = aggregatedData
    localStorage.setItem('CategoryNavData', JSON.stringify(aggregatedData))
  } catch (error) {
    console.error('Error fetching category nav data:', error)
  }
}

const checkForNewData = async () => {
  const updates = await InsightService.fetchAndUpdateStatus()
  console.log('updates: ', updates)
  if (updates) {
    let platformsToUpdate = []
    const allTimestamps = JSON.parse(localStorage.getItem('platformUpdates')) || {}
    console.log('allTimestamps from localStorage: ', allTimestamps)

    Object.keys(updates.data).forEach((platform) => {
      const platformData = updates.data[platform]
      const serverTimestamp = parseInt(platformData)
      const localTimestamp = parseInt(allTimestamps[platform])
      console.log(
        `Checking platform: ${platform}, server timestamp: ${serverTimestamp}, local timestamp: ${localTimestamp}`
      )

      if (!localTimestamp || serverTimestamp > localTimestamp) {
        if (updates.data[platform]) {
          platformsToUpdate.push(platform)
          allTimestamps[platform] = serverTimestamp
        }
      }
    })

    localStorage.setItem('platformUpdates', JSON.stringify(allTimestamps))

    console.log('platformsToUpdate: ', platformsToUpdate)

    if (platformsToUpdate.length > 0) {
      ElMessageBox.confirm('当前页面有新的内容，是否刷新', '新消息提醒', {
        confirmButtonText: '刷新',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          platformsToUpdate.forEach((platform) => {
            if (platform === '36kr') {
              localStorage.removeItem('AINewData')
            } else if (platforms.value.includes(platform)) {
              localStorage.removeItem('CategoryNavData')
            }
          })
          //  通知后端已更新至最新数据
          // InsightService.fetchAndUpdateStatus(true)
          window.location.reload()
        })
        .catch((error) => {
          console.log('error: ', error)
        })
    }
  }
}

onMounted(async () => {
  try {
    await Promise.all([fetchAINewData(), fetchCategoryNavData()])
    timer.value = setTimeout(checkForNewData, 5000)
  } catch (error) {
    console.error('Error during component initialization:', error)
  }
})

onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value)
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
