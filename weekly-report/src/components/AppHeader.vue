<template>
  <div class="app-header">
    <div class="header-left">
      <div class="logo" @click="$router.push('/')">
        <el-icon><Calendar /></el-icon>
        <h1>周报管理系统</h1>
      </div>
    </div>
    
    <div class="header-center">
      <el-menu 
        :default-active="activeMenu" 
        mode="horizontal" 
        router
        class="main-menu"
        background-color="transparent"
        text-color="white"
        active-text-color="white"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/report/list" v-permission="Permission.VIEW_REPORT">周报列表</el-menu-item>
        <has-permission :permission="Permission.CREATE_REPORT">
          <el-menu-item index="/report/create">创建周报</el-menu-item>
        </has-permission>
      </el-menu>
    </div>
    
    <div class="header-right">
      <el-button
        class="theme-toggle"
        text
        @click="toggleTheme"
      >
        <el-icon size="20">
          <component :is="themeIcon" />
        </el-icon>
      </el-button>
      
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar 
            :size="32" 
            :src="authStore.getCurrentUser()?.avatar || ''" 
            class="user-avatar"
          >
            {{ authStore.getCurrentUser()?.name?.charAt(0) || 'U' }}
          </el-avatar>
          <span class="username">{{ authStore.getCurrentUser()?.name || '用户' }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>个人信息
            </el-dropdown-item>
            <el-dropdown-item command="theme">
              <el-icon><component :is="themeIcon" /></el-icon>
              {{ themeStore.currentTheme === 'light' ? '切换深色模式' : '切换浅色模式' }}
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { 
  Calendar, ArrowDown, User, Setting, SwitchButton,
  Moon, Sunny
} from '@element-plus/icons-vue'
import { useAuthStore, Permission } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import HasPermission from '../components/HasPermission.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// 根据当前路由计算激活的菜单项
const activeMenu = computed(() => {
  const { path } = route
  // 对于详情页，激活列表页菜单
  if (path.startsWith('/report/') && !path.endsWith('/list') && !path.endsWith('/create')) {
    return '/report/list'
  }
  return path
})

// 主题相关
const themeIcon = computed(() => 
  themeStore.currentTheme === 'light' ? Moon : Sunny
)

const toggleTheme = () => {
  themeStore.toggleTheme()
  ElMessage.success(`已切换至${themeStore.currentTheme === 'light' ? '浅色' : '深色'}主题`)
}

// 处理下拉菜单操作
const handleCommand = (command: string) => {
  switch(command) {
    case 'theme':
      themeStore.toggleTheme()
      ElMessage.success(`已切换至${themeStore.currentTheme === 'light' ? '浅色' : '深色'}主题`)
      break
    case 'logout':
      ElMessageBox.confirm(
        '确定要退出登录吗？',
        '退出确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        authStore.logout()
        router.push('/login')
        ElMessage.success('已成功退出登录')
      }).catch(() => {
        // 取消操作
      })
      break
    case 'profile':
      router.push('/profile')
      break
  }
}
</script>

<style scoped>
.app-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-light) 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.logo .el-icon {
  font-size: 24px;
}

.logo h1 {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.main-menu {
  border-bottom: none !important;
}

:deep(.el-menu--horizontal > .el-menu-item) {
  height: 60px;
  line-height: 60px;
  border-bottom: none;
  font-size: 1.05em;
  padding: 0 20px;
}

:deep(.el-menu--horizontal > .el-menu-item.is-active) {
  border-bottom: 3px solid white !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-menu--horizontal > .el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 20px;
  transition: all 0.3s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.username {
  font-size: 0.95em;
  font-weight: 500;
  margin-right: 5px;
}

.theme-toggle {
  margin-right: 16px;
  color: white;
}

.theme-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 10px;
  }
  
  .logo h1 {
    font-size: 1.2em;
  }
  
  .main-menu {
    display: none;
  }
  
  .username {
    display: none;
  }
}
</style> 