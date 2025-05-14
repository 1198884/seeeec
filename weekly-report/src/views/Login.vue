<template>
  <div class="login-container">
    <div class="login-wrapper">
      <!-- 左侧信息板 -->
      <div class="info-panel">
        <div class="logo">
          <el-icon class="logo-icon"><Calendar /></el-icon>
          <span>周报管理系统</span>
        </div>
        <h2 class="welcome-text">欢迎回来</h2>
        <p class="description">
          高效管理和跟踪团队工作进度，让团队协作更加便捷
        </p>
        <div class="features">
          <div class="feature-item">
            <el-icon><Document /></el-icon>
            <span>高效创建周报</span>
          </div>
          <div class="feature-item">
            <el-icon><Search /></el-icon>
            <span>快速检索历史记录</span>
          </div>
          <div class="feature-item">
            <el-icon><DataAnalysis /></el-icon>
            <span>可视化工作进度</span>
          </div>
        </div>
        <div class="decoration">
          <img src="https://cdn.jsdelivr.net/gh/bwks/static@master/undraw_report_analysis.svg" alt="报表分析" />
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form-container">
        <div class="login-header">
          <h1>登录账号</h1>
          <p>请输入您的账号信息以继续访问</p>
        </div>
        
        <el-form 
          ref="loginForm" 
          :model="loginData" 
          :rules="rules" 
          status-icon
          @keyup.enter="handleLogin"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input 
              v-model="loginData.username" 
              placeholder="用户名" 
              :prefix-icon="User"
              clearable
              :disabled="loading"
              size="large"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="loginData.password" 
              type="password" 
              placeholder="密码" 
              :prefix-icon="Lock"
              show-password
              clearable
              :disabled="loading"
              size="large"
            />
          </el-form-item>
          
          <div class="login-options">
            <el-checkbox v-model="rememberMe" :disabled="loading">记住我</el-checkbox>
            <el-button type="text" link>忘记密码？</el-button>
          </div>
          
          <el-button 
            type="primary" 
            class="login-button" 
            :loading="loading" 
            @click="handleLogin"
            size="large"
          >
            登录系统
          </el-button>
          
          <div class="login-tips">
           
          </div>
        </el-form>
        
        <div class="login-footer">
          <p>© {{ new Date().getFullYear() }} 周报管理系统 - 版权所有</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Calendar, Document, Search, DataAnalysis, User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loginForm = ref<FormInstance>()

// 如果已经登录，跳转到首页
onMounted(() => {
  if (authStore.isAuthenticated()) {
    router.push('/')
  }
})

const loginData = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度应为3到20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度应为6到20个字符', trigger: 'blur' }
  ]
}

const loading = ref(false)
const rememberMe = ref(false)

const handleLogin = async () => {
  if (!loginForm.value) return
  
  await loginForm.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      try {
        const loggedIn = authStore.login(loginData.username, loginData.password)
        
        if (loggedIn) {
          ElMessage.success('登录成功，欢迎回来！')
          
          // 直接跳转到首页或重定向页面
          const redirect = route.query.redirect as string || '/'
          router.push(redirect)
        } else {
          ElMessage.error('用户名或密码错误')
        }
      } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error('登录失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  padding: 20px;
}

.login-wrapper {
  display: flex;
  width: 1000px;
  height: 600px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  background-color: white;
}

/* 左侧信息面板 */
.info-panel {
  background: linear-gradient(135deg, #409EFF 0%, #36cfc9 100%);
  color: white;
  width: 45%;
  padding: 40px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 60px;
}

.logo-icon {
  font-size: 28px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 10px;
}

.logo span {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.welcome-text {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 16px;
}

.description {
  font-size: 16px;
  opacity: 0.9;
  line-height: 1.6;
  margin-bottom: 40px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-item .el-icon {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 8px;
  border-radius: 10px;
  font-size: 16px;
}

.decoration {
  margin-top: auto;
  text-align: center;
}

.decoration img {
  max-width: 80%;
  max-height: 180px;
  opacity: 0.9;
}

/* 右侧登录表单 */
.login-form-container {
  width: 55%;
  padding: 40px;
  display: flex;
  flex-direction: column;
}

.login-header {
  margin-bottom: 40px;
  text-align: center;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.login-header p {
  color: #909399;
  font-size: 16px;
}

.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 360px;
  margin: 0 auto;
  width: 100%;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.login-button {
  width: 100%;
  height: 50px;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-bottom: 24px;
  background: linear-gradient(to right, var(--primary-color), var(--primary-light));
  border: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.login-tips {
  text-align: center;
  color: #909399;
  font-size: 14px;
  margin-top: 20px;
}

.login-tips p {
  margin: 6px 0;
}

.login-footer {
  margin-top: auto;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 991px) {
  .login-wrapper {
    flex-direction: column;
    height: auto;
    width: 100%;
    max-width: 500px;
  }

  .info-panel {
    width: 100%;
    padding: 30px;
  }

  .login-form-container {
    width: 100%;
    padding: 30px;
  }
  
  .decoration {
    display: none;
  }
  
  .features {
    margin-bottom: 20px;
  }
}

@media (max-width: 480px) {
  .info-panel {
    padding: 20px;
  }
  
  .login-form-container {
    padding: 20px;
  }
  
  .welcome-text {
    font-size: 30px;
  }
  
  .logo {
    margin-bottom: 30px;
  }
}
</style> 