import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dotenv from 'dotenv'

// 加载.env文件中的环境变量
dotenv.config()

export default defineConfig({
  plugins: [vue()],

  define: {
    'process.env': process.env
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  server: {
    proxy: {
      '/api': {
        // target: 'http://localhost:8810',
        target: 'http://chat.xiaohub.cn',
        changeOrigin: true
      }
    }
  }
})
