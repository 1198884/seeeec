<script setup lang="ts">
import { computed, onMounted, onErrorCaptured } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import { useAuthStore } from './stores/auth'
import { useReportStore } from './stores/report'
import { useThemeStore } from './stores/theme'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const reportStore = useReportStore()
const themeStore = useThemeStore()

// 计算是否显示头部导航（登录页不显示）
const showHeader = computed(() => {
  return route.path !== '/login' && authStore.isAuthenticated()
})

// 添加更多错误处理
const totalReports = computed(() => {
  try {
    return reportStore.reports?.length || 0
  } catch (error) {
    console.error('获取总报告数失败:', error)
    return 0
  }
})

const teammates = computed(() => {
  try {
    return authStore.getAllUsers()?.length || 0
  } catch (error) {
    console.error('获取团队成员失败:', error)
    return 0
  }
})

onMounted(() => {
  // 检查认证状态
  const isAuthenticated = authStore.isAuthenticated()
  if (!isAuthenticated && route.path !== '/login') {
    router.push('/login')
  }
})

const handleLogin = async () => {
  if (!loginForm.value) return
  
  await loginForm.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      try {
        const loggedIn = authStore.login(loginData.username, loginData.password)
        
        if (loggedIn) {
          // 移除延迟，直接跳转
          const redirect = route.query.redirect as string || '/'
          router.push(redirect)
          
          ElMessage.success({
            message: '登录成功，欢迎回来！',
            type: 'success',
            duration: 2000
          })
        } else {
          ElMessage.error({
            message: '用户名或密码错误',
            type: 'error',
            duration: 2000
          })
        }
      } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error({
          message: '登录失败，请稍后重试',
          type: 'error',
          duration: 2000
        })
      } finally {
        loading.value = false
      }
    }
  })
}

onErrorCaptured((err, instance, info) => {
  console.error('全局错误:', err, info)
  ElMessage.error({
    message: '系统发生未知错误，请稍后重试',
    duration: 3000
  })
  return false
})
</script>

<template>
  <div class="app-container">
    <AppHeader v-if="showHeader" />
    
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
:root {
  --primary-color: #409EFF;
  --primary-light: #36cfc9;
  --text-primary: #303133;
  --text-regular: #606266;
  --text-secondary: #909399;
  --border-color: #DCDFE6;
  --background-color: #f5f7fa;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100vh;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.el-header {
  height: 60px !important;
  line-height: 60px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  padding: 0 20px !important;
}

.el-main {
  padding: 20px;
  background-color: var(--background-color);
  flex: 1;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Element Plus 组件样式优化 */
.el-button {
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.el-button--primary {
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-light) 100%);
  border: none;
}

.el-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.el-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.el-input__wrapper,
.el-textarea__wrapper {
  border-radius: 8px !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04) !important;
  transition: all 0.3s ease;
}

.el-input__wrapper:hover,
.el-textarea__wrapper:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08) !important;
}

.el-input__wrapper.is-focus,
.el-textarea__wrapper.is-focus {
  box-shadow: 0 0 0 1px var(--primary-color) inset !important;
}

.el-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.el-table th {
  background-color: #f5f7fa !important;
  font-weight: 600;
  color: var(--text-primary);
}

.el-table tr {
  transition: all 0.3s ease;
}

.el-table tr:hover > td {
  background-color: rgba(64, 158, 255, 0.05) !important;
}

.el-pagination {
  margin-top: 20px;
  justify-content: center;
}

.el-tag {
  border-radius: 4px;
  font-weight: 500;
}

.el-empty {
  padding: 40px 0;
}

.el-dropdown-menu {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: none;
}

.el-dropdown-menu__item {
  transition: all 0.3s ease;
}

.el-dropdown-menu__item:hover {
  background-color: rgba(64, 158, 255, 0.1);
  color: var(--primary-color);
}

.el-message-box {
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.el-form-item__label {
  font-weight: 500;
  color: var(--text-primary);
}
</style>
