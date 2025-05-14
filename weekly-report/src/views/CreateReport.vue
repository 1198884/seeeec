<template>
  <div class="report-editor-container">
    <div class="editor-header">
      <div class="back-button">
        <el-button
          @click="goBack"
          icon="ArrowLeft"
          plain
          round
          size="large"
        />
      </div>
      <div class="page-title">
        <h2>{{ isEdit ? '编辑周报' : '创建周报' }}</h2>
        <el-tag effect="light" size="large" class="week-tag">
          {{ currentYear }}年 第{{ currentWeek }}周
        </el-tag>
      </div>
      <div class="action-buttons">
        <el-button @click="goBack" plain>取消</el-button>
        <el-button 
          type="primary" 
          :loading="saving" 
          @click="saveReport"
        >
          保存周报
        </el-button>
      </div>
    </div>

    <div class="editor-content">
      <el-form 
        ref="reportForm" 
        :model="reportData" 
        :rules="rules" 
        label-position="top"
        status-icon
      >
        <el-card class="editor-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-icon">
                <el-icon><Edit /></el-icon>
              </div>
              <div class="header-title">周报标题</div>
            </div>
          </template>
          
          <el-form-item prop="title">
            <el-input 
              v-model="reportData.title" 
              placeholder="请输入周报标题，如：前端开发组第12周工作总结" 
              size="large"
              clearable
            />
          </el-form-item>
        </el-card>

        <el-row :gutter="20" class="editor-row">
          <el-col :xs="24" :lg="12">
            <el-card class="editor-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <div class="header-icon success-icon">
                    <el-icon><Finished /></el-icon>
                  </div>
                  <div class="header-title">本周完成工作</div>
                </div>
              </template>
              
              <el-form-item prop="accomplishments">
                <el-input 
                  v-model="reportData.accomplishments" 
                  type="textarea" 
                  placeholder="请详细描述本周完成的工作内容、成果和收获..." 
                  :rows="8"
                  resize="none"
                />
              </el-form-item>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :lg="12">
            <el-card class="editor-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <div class="header-icon warning-icon">
                    <el-icon><Warning /></el-icon>
                  </div>
                  <div class="header-title">本周遇到的问题</div>
                </div>
              </template>
              
              <el-form-item prop="challenges">
                <el-input 
                  v-model="reportData.challenges" 
                  type="textarea" 
                  placeholder="请描述本周遇到的问题、挑战和解决方案..." 
                  :rows="8"
                  resize="none"
                />
              </el-form-item>
            </el-card>
          </el-col>
        </el-row>

        <el-card class="editor-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-icon primary-icon">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="header-title">下周工作计划</div>
            </div>
          </template>
          
          <el-form-item prop="nextWeekPlan">
            <el-input 
              v-model="reportData.nextWeekPlan" 
              type="textarea" 
              placeholder="请详细描述下周的工作计划、目标和安排..." 
              :rows="6"
              resize="none"
            />
          </el-form-item>
        </el-card>

        <el-card class="editor-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-icon info-icon">
                <el-icon><InfoFilled /></el-icon>
              </div>
              <div class="header-title">其他信息</div>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="周报日期范围" required>
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY/MM/DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  @change="updateDateRange"
                />
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="12">
              <el-form-item label="工作完成度" required>
                <el-slider
                  v-model="reportData.completionRate"
                  :format-tooltip="formatTooltip"
                  :marks="{
                    0: '0%',
                    25: '25%',
                    50: '50%',
                    75: '75%',
                    100: '100%'
                  }"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <div class="submit-actions">
          <el-button @click="goBack" plain>取消</el-button>
          <el-button 
            type="primary" 
            :loading="saving" 
            @click="saveReport"
            size="large"
            class="submit-button"
          >
            保存周报
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { ArrowLeft, Edit, Finished, Warning, Calendar, InfoFilled } from '@element-plus/icons-vue'
import { useReportStore, type WeeklyReportContent, type WeeklyReport } from '../stores/report'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const reportStore = useReportStore()
const authStore = useAuthStore()
const reportForm = ref<FormInstance>()
const saving = ref(false)

// 检查是否是编辑模式
const isEdit = computed(() => {
  // 检查URL路径和参数
  return route.path.includes('/edit/') || route.params.id !== undefined
})

// 获取当前周数和年份
const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}
const currentWeek = getWeekNumber(currentDate)

// 设置周报起始和结束日期
const getWeekRange = () => {
  const monday = new Date(currentDate)
  monday.setDate(currentDate.getDate() - currentDate.getDay() + 1)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  return [
    formatDateToString(monday),
    formatDateToString(sunday)
  ]
}

const formatDateToString = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 周报数据 - 添加类型标注
interface ReportFormData {
  title: string;
  accomplishments: string;
  challenges: string;
  nextWeekPlan: string;
  weekNumber: number;
  year: number;
  completionRate: number;
}

// 周报数据，明确类型
const reportData = reactive<ReportFormData>({
  title: '',
  accomplishments: '',
  challenges: '',
  nextWeekPlan: '',
  weekNumber: currentWeek,
  year: currentYear,
  completionRate: 75
})

// 日期范围
const dateRange = ref<[string, string]>(getWeekRange())

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入周报标题', trigger: 'blur' },
    { min: 5, max: 50, message: '标题长度应为5到50个字符', trigger: 'blur' }
  ],
  accomplishments: [
    { required: true, message: '请描述本周完成的工作', trigger: 'blur' },
    { min: 10, message: '请至少输入10个字符', trigger: 'blur' }
  ],
  challenges: [
    { required: true, message: '请描述本周遇到的问题', trigger: 'blur' },
    { min: 10, message: '请至少输入10个字符', trigger: 'blur' }
  ],
  nextWeekPlan: [
    { required: true, message: '请描述下周工作计划', trigger: 'blur' },
    { min: 10, message: '请至少输入10个字符', trigger: 'blur' }
  ]
}

// 加载编辑数据
const loadReportData = () => {
  if (isEdit.value) {
    const reportId = route.params.id as string
    const report = reportStore.getReport(reportId)
    
    if (report) {
      reportData.title = report.title
      
      // 处理 content 字段
      if (typeof report.content === 'string') {
        // 如果是旧格式，尝试解析或使用空字符串
        reportData.accomplishments = report.content || ''
        reportData.challenges = ''
        reportData.nextWeekPlan = ''
      } else {
        // 如果是新格式，直接使用
        const content = report.content
        reportData.accomplishments = content.accomplishments || ''
        reportData.challenges = content.challenges || ''
        reportData.nextWeekPlan = content.nextWeekPlan || ''
        reportData.completionRate = content.completionRate || 75
        
        if (content.weekStart && content.weekEnd) {
          dateRange.value = [
            content.weekStart,
            content.weekEnd
          ]
        }
      }
      
      reportData.weekNumber = report.weekNumber
      reportData.year = report.year
    } else {
      ElMessage.error('未找到指定周报')
      router.push('/report/list')
    }
  }
}

// 更新日期范围
const updateDateRange = () => {
  if (!dateRange.value) return
  
  // 这里可以更新reportData中的相关日期字段
  console.log('Date range updated', dateRange.value)
}

// 格式化进度条提示
const formatTooltip = (val: number) => {
  return val + '%'
}

// 保存周报
const saveReport = async () => {
  if (!reportForm.value) return
  
  await reportForm.value.validate((valid) => {
    if (valid) {
      saving.value = true
      
      try {
        // 构建保存的数据
        const content: WeeklyReportContent = {
          accomplishments: reportData.accomplishments,
          challenges: reportData.challenges,
          nextWeekPlan: reportData.nextWeekPlan,
          completionRate: reportData.completionRate,
          weekStart: dateRange.value?.[0],
          weekEnd: dateRange.value?.[1]
        }
        
        const reportToSave = {
          title: reportData.title,
          content, // 明确使用WeeklyReportContent对象
          weekNumber: reportData.weekNumber,
          year: reportData.year
        }
        
        if (isEdit.value) {
          // 更新现有周报
          reportStore.updateReport(route.params.id as string, reportToSave)
          ElMessage.success('周报更新成功')
        } else {
          // 创建新周报
          const newReport = reportStore.addReport(reportToSave)
          ElMessage.success('周报创建成功')
        }
        
        // 跳转到周报列表
        router.push('/report/list')
      } catch (error) {
        ElMessage.error('保存失败，请稍后重试')
        console.error('Save error:', error)
      } finally {
        saving.value = false
      }
    } else {
      ElMessage.warning('请完善表单信息')
    }
  })
}

// 返回上一页
const goBack = () => {
  // 如果有未保存的内容，提示用户
  if (reportData.title || reportData.accomplishments || reportData.challenges || reportData.nextWeekPlan) {
    ElMessageBox.confirm(
      '您有未保存的内容，确定要离开吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(() => {
        router.back()
      })
      .catch(() => {
        // 用户取消离开
      })
  } else {
    router.back()
  }
}

onMounted(() => {
  loadReportData()
})
</script>

<style scoped>
.report-editor-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.editor-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.back-button {
  margin-right: 20px;
}

.page-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.week-tag {
  font-size: 16px;
  padding: 8px 12px;
  background-color: #f0f5ff;
  color: var(--primary-color);
  border-color: #d6e4ff;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.editor-content {
  margin-bottom: 60px;
}

.editor-card {
  margin-bottom: 24px;
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.editor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: #f0f5ff;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.success-icon {
  background-color: #f6ffed;
  color: #52c41a;
}

.warning-icon {
  background-color: #fffbe6;
  color: #fa8c16;
}

.primary-icon {
  background-color: #f0f5ff;
  color: var(--primary-color);
}

.info-icon {
  background-color: #e6f7ff;
  color: #1890ff;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
}

.editor-row {
  margin-bottom: 0;
}

.submit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 40px;
}

.submit-button {
  padding: 12px 32px;
  font-size: 16px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .page-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }
  
  .submit-actions {
    flex-direction: column;
  }
  
  .submit-button {
    width: 100%;
  }
}
</style> 