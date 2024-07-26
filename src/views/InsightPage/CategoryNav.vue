<script setup>
import { ref } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const activeName = ref('Facts')

const tabNames = {
  Facts: '快讯',
  Technology: '科技',
  AI: 'AI',
  Finance: '金融',
  News: '新闻',
  Life: '生活',
  Youtube: 'Youtube',
  X: 'X (原Twitter)'
}
</script>

<template>
  <div class="category-nav">
    <el-tabs v-model="activeName" type="border-card" class="tabs">
      <el-tab-pane
        v-for="(items, name) in props.data"
        :key="name"
        :label="tabNames[name]"
        :name="name"
      >
        <ul>
          <li v-for="item in items" :key="item.link">
            <a :href="item.link" target="_blank">{{ item.title }}</a>
          </li>
        </ul>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.category-nav {
  border: none;
  padding: 0;
  background: #f9f9f9;
  width: 100%;
}

.el-tabs {
  width: 100%;
}

.tabs a {
  color: #1a73e8;
  text-decoration: none;
  transition: color 0.3s;
}

.tabs a:hover {
  color: #d93025;
}

.el-tab-pane {
  padding: 10px;
  height: calc(75vh - 50px);
}
</style>
