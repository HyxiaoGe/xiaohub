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
  Technology: '技术',
  Life: '生活',
  AI: 'AI',
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
            <span>{{ item.publication_date }}</span>
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
  overflow-y: auto;
}

ul {
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
  padding: 8px 10px;
  border-bottom: 1px solid #e0e0e0;
}

li:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

a {
  color: #0645ad;
  text-decoration: none;
  flex-grow: 1;
}

a:hover {
  text-decoration: underline;
}

span {
  flex-shrink: 0;
  font-size: 0.85rem;
  color: #888;
  margin-left: 15px;
}
</style>
