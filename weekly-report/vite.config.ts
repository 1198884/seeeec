import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // GitHub Pages 部署的基础路径
  // 如果要部署到 https://<USERNAME>.github.io/<REPO>/ 则设置为 '/<REPO>/'
  // 部署到根域名时，设置为 '/'
  base: process.env.NODE_ENV === 'production' ? '/weekly-report/' : '/',
  css: {
    preprocessorOptions: {
      scss: {
        // 如果有全局的 SCSS 变量，可以在这里引入
        // additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
})
