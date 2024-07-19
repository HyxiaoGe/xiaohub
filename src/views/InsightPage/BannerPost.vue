<template>
  <div class="banner-with-post">
    <div class="banner-img">
      <img
        v-for="(image, index) in images"
        :key="index"
        :src="image"
        alt="轮播图"
        :class="{ active: index === currentImageIndex }"
      />
    </div>
    <div class="post-list">
      <div
        v-for="(post, index) in posts"
        :key="index"
        :class="{ active: index === currentImageIndex }"
      >
        {{ post }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import banner1 from '@/assets/banner1.png'
import banner2 from '@/assets/banner2.jpg'
import banner3 from '@/assets/banner3.png'

const images = ref([banner1, banner2, banner3])
const posts = ref(['文本1', '文本2', '文本3'])
const currentImageIndex = ref(0)

const nextImage = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % images.value.length
}

onMounted(() => {
  setInterval(nextImage, 5000)
})
</script>

<style>
.banner-with-post {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.banner-img {
  width: 300px;
  height: 200px;
  overflow: hidden;
  position: relative;
}

.banner-img img {
  width: 100%;
  height: 100%;
  position: absolute;
  opacity: 0;
  transition: opacity 1s ease-in-out;
}

.banner-img img.active {
  opacity: 1;
}

.post-list {
  display: flex;
  flex-direction: column;
  margin-left: 20px;
  padding: 10px;
}

.post-list div {
  margin-bottom: 10px;
}

.post-list div.active {
  font-weight: bold;
  text-decoration: underline;
}
</style>
