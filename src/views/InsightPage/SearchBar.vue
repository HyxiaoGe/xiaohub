<template>
  <div class="search-bar">
    <input type="text" v-model="query" />
    <el-button style="font-size: 24px" type="primary" class="search" icon="Search" />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const query = ref('')
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
