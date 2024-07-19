<template>
  <div class="insight-page">
    <BarrageFlow class="barrage-flow" />
    <div class="main-content">
      <BannerPost class="banner-post" />
      <div class="side-content">
        <AIHot class="ai-hot" />
        <AINew class="ai-new" />
      </div>
    </div>
    <SearchBar class="search-bar" />
  </div>
</template>

<script setup>
import BarrageFlow from './BarrageFlow.vue'
import BannerPost from './BannerPost.vue' // 改名后的组件
import AIHot from './AIHot.vue'
import AINew from './AINew.vue'
import SearchBar from './SearchBar.vue'
</script>

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
