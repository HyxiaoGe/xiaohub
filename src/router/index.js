import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Chat from '../views/ChatView.vue'
import Image from '../views/ImageView.vue'
import Insight from '../views/InsightPage/InsightPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/chat',
      name: 'chat',
      component: Chat
    },
    {
      path: '/image',
      name: 'image',
      component: Image
    },
    {
      path: '/insight',
      name: 'insight',
      component: Insight
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
