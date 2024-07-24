<template>
  <div class="ai-new">
    <h2>AI 新事早知道</h2>
    <hr />
    <div v-if="currentItem" class="new-item">
      <h3>{{ currentItem.title }}</h3>
      <p>
        {{ currentItem.publication_date }}
      </p>
      <p v-html="currentItem.content"></p>
      原文链接：<a :href="currentItem.link" target="_blank">{{ currentItem.link }}</a>
    </div>
    <ElPagination
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-size="1"
      layout="prev, pager, next"
      :total="data.length"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElPagination } from 'element-plus'

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const currentPage = ref(1)

const currentItem = computed(() => {
  if (props.data && props.data.length > currentPage.value - 1) {
    return props.data[currentPage.value - 1]
  }
  return null
})

const handleCurrentChange = (page) => {
  currentPage.value = page
}
</script>

<style scoped>
.ai-new {
  border: 1px solid #ccc;
  padding: 10px;
  margin-top: 20px;
  font-family: 'Arial', sans-serif;
}

h2 {
  margin-bottom: 0.5em;
  color: #333;
}

hr {
  margin-bottom: 1em;
}

.new-item {
  width: 100%;
  height: 500px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.new-item h3 {
  font-size: 1.5em;
}

.new-item p {
  font-size: 1em;
  line-height: 1.6;
  color: #666;
}

.new-item a {
  color: #007bff;
  text-decoration: none;
}

.new-item a:hover {
  text-decoration: underline;
}

button {
  margin-top: 10px;
  padding: 0.5em 1em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
