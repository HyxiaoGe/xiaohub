<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const newItems = ref(props.data ? props.data['KR_36_AINews'] : [])
const currentPage = ref(1)
const currentItem = ref(newItems.value[currentPage.value - 1])

watch(currentPage, (newVal) => {
  currentItem.value = newItems.value[newVal - 1]
})

const handleCurrentChange = (page) => {
  currentPage.value = page
}
</script>

<template>
  <div class="ai-new">
    <h1>OpenAI 最新视角</h1>
    <hr />
    <div v-if="currentItem" class="new-item">
      <!--加粗-->
      <h4 style="font-size: 18px">{{ currentItem.title }}</h4>
      <p>
        时间：
        {{ currentItem.publication_date }}
      </p>
      <p v-html="currentItem.content"></p>
      原文链接：<a :href="currentItem.link" target="_blank">{{ currentItem.link }}</a>
    </div>
    <el-pagination
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-size="1"
      layout="prev, pager, next"
      :total="newItems.length"
    />
  </div>
</template>

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
