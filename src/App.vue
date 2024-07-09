<script setup></script>

<template>
  <div id="nav">
    <router-link to="/"></router-link>
    <router-link to="/chat"></router-link>
    <router-link to="/image"></router-link>
    <router-link to="/video"></router-link>
    <router-link to="/about"></router-link>
  </div>
  <router-view />
</template>

<style scoped>
#nav {
  display: flex;
  justify-content: space-around; /* 或者其他布局方式 */
  /* ...其他样式... */
}
</style>
