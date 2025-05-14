<template>
  <div class="home-container">
    <!-- 顶部概览卡片 -->
    <div class="stat-cards">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card stat-card-primary" shadow="hover">
            <div class="stat-card-content">
              <div class="stat-card-value">{{ totalReports }}</div>
              <div class="stat-card-title">周报总数</div>
            </div>
            <div class="stat-card-icon">
              <el-icon><Document /></el-icon>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card stat-card-success" shadow="hover">
            <div class="stat-card-content">
              <div class="stat-card-value">{{ thisWeekReports }}</div>
              <div class="stat-card-title">本周提交</div>
            </div>
            <div class="stat-card-icon">
              <el-icon><Calendar /></el-icon>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card stat-card-warning" shadow="hover">
            <div class="stat-card-content">
              <div class="stat-card-value">{{ teammates }}</div>
              <div class="stat-card-title">团队成员</div>
            </div>
            <div class="stat-card-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card stat-card-danger" shadow="hover">
            <div class="stat-card-content">
              <div class="stat-card-value">{{ completionRate }}%</div>
              <div class="stat-card-title">提交率</div>
            </div>
            <div class="stat-card-icon">
              <el-icon><PieChart /></el-icon>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 快捷操作按钮 -->
    <div class="quick-actions">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="action-card" shadow="hover" @click="navigateTo('/report/create')">
            <div class="action-icon">
              <el-icon><EditPen /></el-icon>
            </div>
            <div class="action-content">
              <h3>创建周报</h3>
              <p>记录本周工作内容和计划</p>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="action-card" shadow="hover" @click="navigateTo('/report/list')">
            <div class="action-icon">
              <el-icon><List /></el-icon>
            </div>
            <div class="action-content">
              <h3>查看周报</h3>
              <p>浏览个人和团队的周报记录</p>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="action-card" shadow="hover" @click="navigateTo('/profile')">
            <div class="action-icon">
              <el-icon><Setting /></el-icon>
            </div>
            <div class="action-content">
              <h3>个人设置</h3>
              <p>管理个人信息和偏好设置</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 数据展示区域 -->
    <el-row :gutter="20" class="data-section">
      <!-- 最近周报列表 -->
      <el-col :xs="24" :lg="14">
        <el-card class="data-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>最近周报</h3>
              <el-button
                type="primary"
                text
                @click="navigateTo('/report/list')"
              >
                查看全部
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          
          <el-table
            :data="recentReports"
            style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa' }"
          >
            <el-table-column prop="title" label="标题" min-width="180" />
            <el-table-column prop="username" label="提交人" width="120" />
            <el-table-column prop="submittedDate" label="提交日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.submittedDate) }}
              </template>
            </el-table-column>
            <el-table-column width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  @click="viewReport(row.id)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-if="recentReports.length === 0" class="no-data">
            <el-empty description="暂无周报数据" />
          </div>
        </el-card>
      </el-col>
      
      <!-- 提交趋势图 -->
      <el-col :xs="24" :lg="10">
        <el-card class="data-card chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>提交趋势</h3>
              <el-radio-group v-model="chartTimeRange" size="small">
                <el-radio-button label="week">一周</el-radio-button>
                <el-radio-button label="month">一月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <div class="chart-container">
            <div class="chart-placeholder">
              <div class="chart-bar" v-for="(value, index) in chartData" :key="index"
                   :style="{ height: `${value*2}px` }"
                   :class="{ 'current-day': index === currentDayIndex }">
                <div class="chart-tooltip">{{ value }}份</div>
              </div>
            </div>
            <div class="chart-labels">
              <div v-for="(day, index) in chartLabels" :key="index">{{ day }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useReportStore } from '../stores/report'
import { 
  Document, Calendar, UserFilled, PieChart, 
  EditPen, List, Setting, ArrowRight 
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const reportStore = useReportStore()

const totalReports = computed(() => reportStore.reports.length)
const teammates = computed(() => authStore.getAllUsers().length)

// 当前周
const currentDate = new Date()
const currentWeekStart = new Date(currentDate)
currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay())
currentWeekStart.setHours(0, 0, 0, 0)

const thisWeekReports = computed(() => {
  return reportStore.reports.filter(report => {
    const reportDate = new Date(report.createdAt)
    return reportDate >= currentWeekStart
  }).length
})

const completionRate = computed(() => {
  const expectedReports = teammates.value
  return expectedReports ? Math.round((thisWeekReports.value / expectedReports) * 100) : 0
})

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 最近周报数据
const recentReports = computed(() => {
  return [...reportStore.reports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(report => ({
      id: report.id,
      title: report.title || `第${report.weekNumber}周周报`,
      username: authStore.getAllUsers().find(u => u.id === 1)?.name || '未知用户',
      submittedDate: report.createdAt
    }))
})

// 图表数据相关
const chartTimeRange = ref('week')
const chartLabels = ref(['周一', '周二', '周三', '周四', '周五', '周六', '周日'])
const chartData = ref([3, 5, 2, 7, 4, 1, 6])

// 当前日期对应的索引
const currentDayIndex = computed(() => {
  const day = currentDate.getDay()
  return day === 0 ? 6 : day - 1
})

// 导航方法
const navigateTo = (path: string) => {
  router.push(path)
}

// 查看周报
const viewReport = (id: string) => {
  router.push(`/report/${id}`)
}
</script>

<style scoped>
.home-container {
  padding: 20px;  /* 恢复原来的内边距 */
}

/* 统计卡片样式 */
.stat-cards {
  margin-bottom: 24px;
}

.stat-card {
  height: 120px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  overflow: hidden;
  position: relative;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-card-content {
  z-index: 1;
}

.stat-card-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1;
}

.stat-card-title {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.45);
}

.stat-card-icon {
  font-size: 48px;
  opacity: 0.2;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.stat-card-primary {
  background: linear-gradient(to right, #1890ff, #64b5f6);
  color: white;
}

.stat-card-primary .stat-card-title {
  color: rgba(255, 255, 255, 0.8);
}

.stat-card-success {
  background: linear-gradient(to right, #52c41a, #8bc34a);
  color: white;
}

.stat-card-success .stat-card-title {
  color: rgba(255, 255, 255, 0.8);
}

.stat-card-warning {
  background: linear-gradient(to right, #fa8c16, #ffc107);
  color: white;
}

.stat-card-warning .stat-card-title {
  color: rgba(255, 255, 255, 0.8);
}

.stat-card-danger {
  background: linear-gradient(to right, #f5222d, #ff5722);
  color: white;
}

.stat-card-danger .stat-card-title {
  color: rgba(255, 255, 255, 0.8);
}

/* 快捷操作卡片 */
.quick-actions {
  margin-bottom: 24px;
}

.action-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  height: 100px;
  border-radius: 16px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 60px;
  height: 60px;
  background: #f0f5ff;
  color: var(--primary-color);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.action-content h3 {
  margin: 0 0 5px;
  font-size: 18px;
  font-weight: 600;
}

.action-content p {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

/* 数据卡片样式 */
.data-section {
  margin-bottom: 24px;
}

.data-card {
  border-radius: 16px;
  height: 400px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 10px;
}

.chart-placeholder {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 10px;
}

.chart-bar {
  width: 25px;
  background-color: #e6f7ff;
  border-radius: 4px;
  position: relative;
  transition: height 0.3s;
}

.chart-bar:hover {
  background-color: #bae7ff;
}

.chart-bar:hover .chart-tooltip {
  opacity: 1;
}

.chart-tooltip {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #303133;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.chart-bar.current-day {
  background-color: var(--primary-color);
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 14px;
  color: #8c8c8c;
}

.no-data {
  padding: 60px 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stat-card {
    margin-bottom: 20px;
  }
  
  .action-card {
    margin-bottom: 20px;
  }
  
  .chart-bar {
    width: 20px;
  }
}

@media (max-width: 992px) {
  .data-section > .el-col {
    margin-bottom: 20px;
  }
}
</style> 