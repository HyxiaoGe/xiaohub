<template>
  <div class="search-bar">
    <input type="text" v-model="query" @keyup.enter="handleSearch" />
    <el-button
      style="font-size: 24px"
      type="primary"
      class="search"
      icon="Search"
      @click="handleSearch"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const query = ref('')
const router = useRouter()

const handleSearch = () => {
  if (query.value.trim()) {
    router.push({ name: 'SearchResults', query: { q: query.value } })
  }
}
</script>

<style scoped>
.search-bar {
  margin-top: 20px;
  display: flex;
}
.search-bar input {
  flex: 1;
  padding: 5px;
}
.search-bar button {
  margin-left: 5px;
  padding: 5px 10px;
}
</style>
