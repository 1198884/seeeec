<template>
  <div class="report-detail">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="header-left">
            <h4>周报详情</h4>
            <el-tag v-if="report" type="info" effect="plain">
              {{ report.year }}年 第{{ report.weekNumber }}周
            </el-tag>
          </div>
          <div class="header-actions">
            <el-button @click="$router.push('/report/list')" plain>
              <el-icon><Back /></el-icon>
              返回列表
            </el-button>
          </div>
        </div>
      </el-header>
      <el-main v-loading="loading">
        <div v-if="report" class="report-content">
          <el-card class="report-card" shadow="hover">
            <template #header>
              <div class="report-header">
                <h2>{{ report.title }}</h2>
                <div class="report-meta">
                  <div class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    <span>创建时间：{{ formatDate(report.createdAt) }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><Timer /></el-icon>
                    <span>更新时间：{{ formatDate(report.updatedAt) }}</span>
                  </div>
                  <!-- 显示周报日期范围(如果有) -->
                  <div class="meta-item" v-if="reportContent.weekStart && reportContent.weekEnd">
                    <el-icon><Calendar /></el-icon>
                    <span>周报日期：{{ reportContent.weekStart }} 至 {{ reportContent.weekEnd }}</span>
                  </div>
                  <!-- 显示完成率(如果有) -->
                  <div class="meta-item" v-if="reportContent.completionRate !== undefined">
                    <el-icon><DataLine /></el-icon>
                    <span>完成率：{{ reportContent.completionRate }}%</span>
                  </div>
                </div>
              </div>
            </template>
            <div class="report-body">
              <div class="content-sections">
                <!-- 显示本周工作进展 -->
                <div class="content-section">
                  <div class="section-header">
                    <el-icon><Check /></el-icon>
                    <h3>本周工作进展</h3>
                  </div>
                  <div class="section-content" v-html="formatContent(reportContent.accomplishments)"></div>
                </div>
                
                <!-- 显示本周遇到的问题 -->
                <div class="content-section" v-if="reportContent.challenges">
                  <div class="section-header">
                    <el-icon><Warning /></el-icon>
                    <h3>本周遇到的问题</h3>
                  </div>
                  <div class="section-content" v-html="formatContent(reportContent.challenges)"></div>
                </div>
                
                <!-- 显示下周工作计划 -->
                <div class="content-section">
                  <div class="section-header">
                    <el-icon><Calendar /></el-icon>
                    <h3>下周工作计划</h3>
                  </div>
                  <div class="section-content" v-html="formatContent(reportContent.nextWeekPlan)"></div>
                </div>
              </div>
            </div>
          </el-card>
          <div class="action-buttons">
            <el-button type="primary" @click="$router.push('/report/create')">
              <el-icon><Plus /></el-icon>
              创建新周报
            </el-button>
            <el-button @click="$router.push('/')">
              <el-icon><HomeFilled /></el-icon>
              返回首页
            </el-button>
          </div>
          <div class="detail-actions">
            <el-button
              type="primary"
              plain
              @click="$router.push('/report/list')"
            >
              <el-icon><Back /></el-icon>
              返回列表
            </el-button>
            
            <has-permission :permission="Permission.EDIT_REPORT">
              <el-button
                type="success"
                plain
                @click="editReport"
              >
                <el-icon><Edit /></el-icon>
                编辑周报
              </el-button>
            </has-permission>
            
            <has-permission :permission="Permission.DELETE_REPORT">
              <el-button
                type="danger"
                plain
                @click="confirmDelete"
              >
                <el-icon><Delete /></el-icon>
                删除周报
              </el-button>
            </has-permission>
            
            <el-dropdown>
              <el-button type="primary">
                更多操作
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="exportToPDF">
                    <el-icon><Document /></el-icon>导出为PDF
                  </el-dropdown-item>
                  <el-dropdown-item @click="exportToWord">
                    <el-icon><Document /></el-icon>导出为Word
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="shareReport">
                    <el-icon><Share /></el-icon>分享
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <el-empty v-else-if="!loading" description="周报不存在">
          <el-button type="primary" @click="$router.push('/report/list')">
            返回列表
          </el-button>
        </el-empty>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReportStore, type WeeklyReport, type WeeklyReportContent } from '../stores/report'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Back, Calendar, Timer, Check, Plus, HomeFilled, Edit, 
  Delete, ArrowDown, Document, Share, Warning, DataLine
} from '@element-plus/icons-vue'
import { Permission } from '../stores/auth'
import HasPermission from '../components/HasPermission.vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const reportStore = useReportStore()
const authStore = useAuthStore()
const loading = ref(true)
const report = ref<WeeklyReport | null>(null)

// 在路由参数变化时重新获取报告
watch(() => route.params.id, (newId) => {
  if (newId) {
    loading.value = true
    const foundReport = reportStore.getReport(newId as string)
    report.value = foundReport
    
    if (!foundReport) {
      ElMessage.error('周报不存在')
      router.push('/report/list')
    }
    loading.value = false
  }
}, { immediate: true })

// 获取报告内容，并确保它是一个WeeklyReportContent对象
const reportContent = computed<WeeklyReportContent>(() => {
  if (!report.value) {
    return {
      accomplishments: '',
      challenges: '',
      nextWeekPlan: '',
    }
  }

  // 处理content
  if (typeof report.value.content === 'string') {
    try {
      // 尝试解析JSON字符串
      return JSON.parse(report.value.content);
    } catch {
      // 如果不是有效的JSON，使用简单模板
      return {
        accomplishments: report.value.content || '',
        challenges: '',
        nextWeekPlan: ''
      }
    }
  }
  
  // 返回content对象
  return report.value.content;
})

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化内容
const formatContent = (text: string) => {
  if (!text) return ''
  return text.replace(/\n/g, '<br>')
}

// 编辑周报
const editReport = () => {
  if (!authStore.hasPermission(Permission.EDIT_REPORT)) {
    ElMessage.error('您没有编辑周报的权限')
    return
  }

  if (report.value) {
    router.push(`/report/edit/${report.value.id}`)
  }
}

// 确认删除
const confirmDelete = () => {
  if (!authStore.hasPermission(Permission.DELETE_REPORT)) {
    ElMessage.error('您没有删除周报的权限')
    return
  }

  if (!report.value) return
  
  ElMessageBox.confirm(
    '确定要删除这份周报吗？此操作不可恢复。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    if (report.value) {
      reportStore.deleteReport(report.value.id)
      ElMessage.success('周报已删除')
      router.push('/report/list')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 导出为PDF
const exportToPDF = () => {
  ElMessage.success('PDF导出功能正在开发中')
}

// 导出为Word
const exportToWord = () => {
  ElMessage.success('Word导出功能正在开发中')
}

// 分享周报
const shareReport = () => {
  ElMessage.success('分享功能正在开发中')
}

onMounted(async () => {
  try {
    loading.value = true
    
    // 从URL参数获取报告ID
    const reportId = route.params.id as string
    if (!reportId) {
      throw new Error('报告ID不能为空')
    }
    
    // 通过Store获取报告
    const foundReport = reportStore.getReport(reportId)
    if (foundReport) {
      report.value = foundReport
      console.log('加载周报成功:', report.value.title)
    } else {
      // 如果从store找不到，尝试从localStorage备份恢复
      try {
        const savedReport = localStorage.getItem('current-viewing-report')
        if (savedReport) {
          const parsedReport = JSON.parse(savedReport)
          if (parsedReport.id === reportId) {
            report.value = parsedReport
            console.log('从缓存恢复周报:', parsedReport.title)
          } else {
            throw new Error('缓存的报告ID不匹配')
          }
        } else {
          throw new Error('未找到缓存的报告')
        }
      } catch (e) {
        console.error('从缓存恢复失败:', e)
        throw new Error('未找到指定周报')
      }
    }
  } catch (error) {
    console.error('加载周报失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '加载周报失败')
    router.push('/report/list')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.report-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
}

.el-header {
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-light) 100%);
  color: white;
  padding: 0 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h4 {
  margin: 0;
  font-size: 1.8em;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
}

.el-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.report-content {
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.report-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.report-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.report-header {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 5px 0;
}

.report-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.8em;
  font-weight: 600;
  line-height: 1.3;
}

.report-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 0.95em;
}

.meta-item .el-icon {
  color: var(--primary-color);
  opacity: 0.8;
}

.report-body {
  padding: 20px 0;
}

.content-wrapper {
  background: #fafafa;
  padding: 25px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.content-wrapper pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  margin: 0;
  color: var(--text-regular);
  line-height: 1.8;
  font-size: 1.05em;
}

.content-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.content-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.content-section:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.section-header .el-icon {
  font-size: 22px;
  color: var(--primary-color);
  background: rgba(64, 158, 255, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-header h3 {
  margin: 0;
  font-size: 1.3em;
  font-weight: 600;
  color: var(--text-primary);
}

.section-content {
  color: var(--text-regular);
  line-height: 1.8;
  font-size: 1.05em;
}

.section-content :deep(p) {
  margin: 10px 0;
}

.section-content :deep(ul) {
  margin: 10px 0;
  padding-left: 20px;
}

.section-content :deep(li) {
  margin-bottom: 8px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.el-empty {
  margin-top: 40px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.detail-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 10px;
    padding: 10px 0;
  }
  
  .el-main {
    padding: 20px;
  }

  .report-header h2 {
    font-size: 1.5em;
  }

  .content-wrapper {
    padding: 15px;
  }

  .content-wrapper pre {
    font-size: 1em;
  }
  
  .section-header .el-icon {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
  
  .section-header h3 {
    font-size: 1.2em;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 