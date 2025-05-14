import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore, Permission } from '../stores/auth'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: {
        title: '登录',
        requiresAuth: false
      }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
      meta: {
        title: '首页',
        requiresAuth: true
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue'),
      meta: {
        title: '个人信息',
        requiresAuth: true,
        permissions: [Permission.MANAGE_USERS]
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/Settings.vue'),
      meta: {
        title: '系统设置',
        requiresAuth: true,
        permissions: [Permission.MANAGE_USERS]
      }
    },
    {
      path: '/report/create',
      name: 'create-report',
      component: () => import('../views/CreateReport.vue'),
      meta: {
        title: '创建周报',
        requiresAuth: true,
        permissions: [Permission.CREATE_REPORT]
      }
    },
    {
      path: '/report/edit/:id',
      name: 'edit-report',
      component: () => import('../views/CreateReport.vue'),
      meta: {
        title: '编辑周报',
        requiresAuth: true,
        permissions: [Permission.EDIT_REPORT]
      }
    },
    {
      path: '/report/list',
      name: 'report-list',
      component: () => import('../views/ReportList.vue'),
      meta: {
        title: '周报列表',
        requiresAuth: true,
        permissions: [Permission.VIEW_REPORT]
      }
    },
    {
      path: '/report/:id',
      name: 'report-detail',
      component: () => import('../views/ReportDetail.vue'),
      meta: {
        title: '周报详情',
        requiresAuth: true,
        permissions: [Permission.VIEW_REPORT]
      }
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('../views/TestView.vue'),
      meta: {
        title: '测试页面',
        requiresAuth: true
      }
    }
  ]
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  // 更新页面标题
  document.title = `${to.meta.title || '周报系统'}`
  
  const authStore = useAuthStore()
  
  try {
    // 获取认证状态
    const isAuthenticated = authStore.isAuthenticated()
    
    // 如果用户已登录但尝试访问登录页，直接重定向到首页
    if (isAuthenticated && to.path === '/login') {
      next({ path: '/' })
      return
    }
    
    // 检查该路由是否需要登录
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    
    if (requiresAuth) {
      if (!isAuthenticated) {
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
      
      // 检查权限
      const requiredPermissions = to.meta.permissions as Permission[] | undefined
      
      if (requiredPermissions?.length > 0) {
        const hasPermission = authStore.hasAnyPermission(requiredPermissions)
        
        if (!hasPermission) {
          ElMessage.error('您没有访问该页面的权限')
          next({ path: '/' })
          return
        }
      }
    }
    
    next()
  } catch (error) {
    console.error('Route guard error:', error)
    next({ path: '/login' })
  }
})

export default router 