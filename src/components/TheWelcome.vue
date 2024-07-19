<template>
  <div class="welcome">
    <el-row type="flex" justify="center">
      <el-col :span="24">
        <h3 class="welcome-title">欢迎来到 XiaoHub, 请选择想要体验的功能：</h3>
        <div class="nav-buttons-creative" style="margin-bottom: 1em">
          <router-link to="/chat" custom v-slot="{ navigate }">
            <el-tooltip content="AI 聊天" placement="top">
              <el-button
                class="chat-button"
                type="primary"
                icon="ChatLineRound"
                style="font-size: 24px"
                placeholder="tttt"
                @click="navigate"
              />
            </el-tooltip>
          </router-link>
          <router-link to="/image" custom v-slot="{ navigate }">
            <el-tooltip content="AI 生图" placement="top">
              <el-button
                class="img-button"
                type="primary"
                icon="Picture"
                style="font-size: 24px"
                @click="navigate"
            /></el-tooltip>
          </router-link>
          <router-link to="/insight" custom v-slot="{ navigate }">
            <el-tooltip content="AI 面板" placement="top">
              <el-button
                class="radio-button"
                type="primary"
                icon="Platform"
                style="font-size: 24px"
                @click="navigate"
              />
            </el-tooltip>
          </router-link>
          <!-- <router-link to="/video" custom v-slot="{ navigate }">
            <el-tooltip content="AI 短视频" placement="top">
              <el-button
                class="shortvideo-button"
                type="primary"
                icon="VideoPlay"
                style="font-size: 24px"
                @click="navigate"
              />
            </el-tooltip>
          </router-link> -->
          <!-- </div>
        <div class="nav-buttons-analyze"> -->
          <!-- <router-link to="/video" custom v-slot="{ navigate }">
            <el-tooltip content="AI 音乐" placement="top">
              <el-button
                class="music-button"
                type="primary"
                icon="Headset"
                style="font-size: 24px"
                @click="navigate"
              />
            </el-tooltip>
          </router-link>
          <router-link to="/video" custom v-slot="{ navigate }">
            <el-tooltip content="AI 数据分析" placement="top">
              <el-button
                class="analyze-button"
                type="primary"
                icon="DataLine"
                style="font-size: 24px"
                @click="navigate"
              />
            </el-tooltip>
          </router-link> -->
          <router-link to="/" custom v-slot="{ navigate }">
            <el-tooltip content="开发中..." placement="top">
              <el-button
                class="morefill-button"
                type="primary"
                icon="MoreFilled"
                style="font-size: 24px"
                @click="navigate"
              />
            </el-tooltip>
          </router-link>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup></script>
<style scoped src="../styles/welcome.css"></style>
