<template>
  <div class="test-view">
    <h1>测试页面</h1>
    
    <div class="section">
      <h2>报告列表</h2>
      <button @click="loadReports">刷新报告列表</button>
      <ul class="report-list">
        <li v-for="report in reports" :key="report.id" class="report-item">
          <div class="report-title">{{ report.title }}</div>
          <div class="report-meta">
            ID: {{ report.id }} | 
            创建时间: {{ new Date(report.createdAt).toLocaleString() }}
          </div>
          <button @click="viewReport(report)">查看</button>
        </li>
      </ul>
    </div>
    
    <div class="section" v-if="selectedReport">
      <h2>选中的报告</h2>
      <div class="report-detail">
        <h3>{{ selectedReport.title }}</h3>
        <p>ID: {{ selectedReport.id }}</p>
        <p>创建时间: {{ new Date(selectedReport.createdAt).toLocaleString() }}</p>
        <pre>{{ JSON.stringify(selectedReport.content, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useReportStore, type WeeklyReport } from '../stores/report'
import { useRouter } from 'vue-router'

const router = useRouter()
const reportStore = useReportStore()
const reports = ref<WeeklyReport[]>([])
const selectedReport = ref<WeeklyReport | null>(null)

// 加载报告列表
const loadReports = () => {
  reports.value = reportStore.reports
}

// 查看报告
const viewReport = (report: WeeklyReport) => {
  selectedReport.value = report
  
  // 同时存储到localStorage
  localStorage.setItem('current-viewing-report', JSON.stringify(report))
  
  // 跳转到报告详情页面
  router.push(`/report/${report.id}`)
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped>
.test-view {
  padding: 20px;
}

.section {
  margin-bottom: 30px;
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 5px;
}

.report-list {
  list-style: none;
  padding: 0;
}

.report-item {
  border: 1px solid #eee;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
}

.report-title {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 5px;
}

.report-meta {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

button {
  background: #409EFF;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
}

button:hover {
  background: #66b1ff;
}

.report-detail {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
}

pre {
  background: #f1f1f1;
  padding: 10px;
  border-radius: 3px;
  overflow: auto;
}
</style> 