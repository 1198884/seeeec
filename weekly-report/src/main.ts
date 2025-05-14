import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './style.css'
import './styles/theme.scss'
import { setupPermissionDirective } from './directives/permission'
import { ElMessage } from 'element-plus'

const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err)
  console.error('Error info:', info)
  
  // 显示用户友好的错误消息
  if (err instanceof Error) {
    if (err.message.includes('is not a function')) {
      console.error('Method not found error:', err.message)
      ElMessage.error('系统初始化失败，请刷新页面重试')
    } else {
      ElMessage.error(err.message || '操作失败，请稍后重试')
    }
  } else {
    ElMessage.error('系统发生错误，请稍后重试')
  }
}

// 处理未捕获的Promise错误
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason)
  ElMessage.error('操作失败，请稍后重试')
  event.preventDefault()
})

const pinia = createPinia()
app.use(pinia)
app.use(router)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册UI库
app.use(ElementPlus)

// 注册权限指令
setupPermissionDirective(app)

// 初始化主题
import { useThemeStore } from './stores/theme'
const themeStore = useThemeStore()
// 确保初始主题被应用
document.documentElement.setAttribute('data-theme', themeStore.currentTheme)

// 挂载应用
app.mount('#app')
