<template>
  <div class="report-list">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="header-left">
            <h4>周报列表</h4>
            <el-tag type="success" effect="plain" class="report-count">
              共 {{ filteredReports.length }} 份周报
            </el-tag>
          </div>
          <div class="header-actions">
            <el-dropdown @command="handleExport">
              <el-button type="primary">
                <el-icon><Download /></el-icon>
                导出周报
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="json">导出为 JSON</el-dropdown-item>
                  <el-dropdown-item command="word">导出为 Word</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-upload
              class="upload-demo"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept=".json,.docx"
              @change="handleImport"
            >
              <el-button type="primary" plain>
                <el-icon><Upload /></el-icon>
                导入周报
              </el-button>
            </el-upload>
            <has-permission :permission="Permission.CREATE_REPORT">
              <el-button type="primary" @click="$router.push('/report/create')">
                <el-icon><Plus /></el-icon>
                新建周报
              </el-button>
            </has-permission>
            <el-button @click="$router.push('/')" plain>
              <el-icon><Back /></el-icon>
              返回首页
            </el-button>
          </div>
        </div>
      </el-header>
      <el-main>
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索周报标题"
            class="search-input"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="yearFilter" placeholder="选择年份" clearable>
            <el-option
              v-for="year in availableYears"
              :key="year"
              :label="year"
              :value="year"
            />
          </el-select>
          <el-switch
            v-model="showOnlyCurrentWeek"
            active-text="仅显示本周"
            inactive-text="显示所有"
            @change="toggleDisplayMode"
          />
        </div>

        <el-table 
          :data="filteredReports" 
          style="width: 100%" 
          v-loading="loading"
          :empty-text="loading ? '加载中...' : '暂无周报数据'"
          border
          stripe
        >
          <el-table-column prop="title" label="标题" min-width="200">
            <template #default="{ row }">
              <div class="report-title">
                <span>{{ row.title }}</span>
                <el-tag size="small" type="info" effect="plain">
                  {{ row.year }}年 第{{ row.weekNumber }}周
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              <div class="time-info">
                <el-icon><Calendar /></el-icon>
                {{ new Date(row.createdAt).toLocaleString() }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button
                  type="primary"
                  size="small"
                  @click="viewReport(row)"
                >
                  <el-icon><View /></el-icon>
                  查看
                </el-button>
                <has-permission :permission="Permission.EDIT_REPORT">
                  <el-button
                    type="warning"
                    size="small"
                    @click="editReport(row)"
                  >
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                </has-permission>
                <has-permission :permission="Permission.DELETE_REPORT">
                  <el-button
                    type="danger"
                    size="small"
                    @click="deleteReport(row.id)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </has-permission>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-if="filteredReports.length === 0 && !loading"
          description="暂无周报数据"
        >
          <el-button type="primary" @click="$router.push('/report/create')">
            创建新周报
          </el-button>
        </el-empty>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore, type WeeklyReport, type WeeklyReportContent } from '../stores/report'
import { useAuthStore, Permission } from '../stores/auth'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Back, Search, Calendar, View, Delete, Upload, Download, ArrowDown, Edit } from '@element-plus/icons-vue'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'
import mammoth from 'mammoth'
import HasPermission from '../components/HasPermission.vue'

const router = useRouter()
const reportStore = useReportStore()
const authStore = useAuthStore()
const searchQuery = ref('')
const yearFilter = ref('')
const loading = ref(false)
const showOnlyCurrentWeek = ref(false)

const availableYears = computed(() => {
  const years = new Set(reportStore.reports.map(report => report.year))
  return Array.from(years).sort((a, b) => b - a)
})

// 获取当前周数
const getCurrentWeekNumber = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  return Math.ceil(diff / oneWeek)
}

const currentYear = new Date().getFullYear()
const currentWeek = getCurrentWeekNumber()

const filteredReports = computed(() => {
  return reportStore.reports
    .filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesYear = !yearFilter.value || report.year.toString() === yearFilter.value
      
      // 如果启用了"只显示当前周"过滤器，则只显示当前年份和周数的报告
      const matchesCurrentWeek = !showOnlyCurrentWeek.value || 
        (report.year === currentYear && report.weekNumber === currentWeek)
      
      return matchesSearch && matchesYear && matchesCurrentWeek
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

// 切换显示模式
const toggleDisplayMode = () => {
  console.log('Display mode changed:', showOnlyCurrentWeek.value ? 'Only current week' : 'All reports')
}

onMounted(() => {
  yearFilter.value = currentYear.toString()
})

const viewReport = (report: WeeklyReport) => {
  // 存储当前报告到localStorage，作为备份
  localStorage.setItem('current-viewing-report', JSON.stringify(report))
  
  // 直接路由跳转
  router.push({
    path: `/report/${report.id}`
  })
}

const deleteReport = async (id: string) => {
  if (!authStore.hasPermission(Permission.DELETE_REPORT)) {
    ElMessage.error('您没有删除周报的权限')
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除这份周报吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
    
    reportStore.deleteReport(id)
    ElMessage.success('周报删除成功')
  } catch {
    // 用户取消删除
  }
}

// 导出周报
const handleExport = async (format: 'json' | 'word') => {
  if (format === 'json') {
    exportToJson()
  } else {
    exportToWord()
  }
}

// 导出为 JSON
const exportToJson = () => {
  try {
    const data = JSON.stringify(reportStore.reports, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `weekly-reports-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('周报导出成功')
  } catch (error) {
    ElMessage.error('周报导出失败')
  }
}

// 导出为 Word
const exportToWord = async () => {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: '周报列表',
            heading: HeadingLevel.HEADING_1,
            alignment: 'center'
          }),
          new Paragraph({
            text: `导出时间：${new Date().toLocaleString()}`,
            alignment: 'right'
          }),
          new Paragraph({}),
          ...reportStore.reports.map(report => {
            // 获取content内容，处理新的WeeklyReportContent结构
            const content = typeof report.content === 'string' 
              ? report.content 
              : report.content as WeeklyReportContent;
            
            // 获取具体内容    
            const accomplishments = typeof content === 'string' 
              ? content 
              : content.accomplishments || '';
              
            const challenges = typeof content === 'string'
              ? ''
              : content.challenges || '';
              
            const nextWeekPlan = typeof content === 'string'
              ? ''
              : content.nextWeekPlan || '';
            
            return [
              new Paragraph({
                text: report.title,
                heading: HeadingLevel.HEADING_2
              }),
              new Paragraph({
                text: `${report.year}年 第${report.weekNumber}周`,
                alignment: 'right'
              }),
              new Paragraph({
                text: '本周工作进展：',
                heading: HeadingLevel.HEADING_3
              }),
              new Paragraph({
                text: accomplishments,
                spacing: { after: 200 }
              }),
              new Paragraph({
                text: '本周遇到的问题：',
                heading: HeadingLevel.HEADING_3
              }),
              new Paragraph({
                text: challenges,
                spacing: { after: 200 }
              }),
              new Paragraph({
                text: '下周工作计划：',
                heading: HeadingLevel.HEADING_3
              }),
              new Paragraph({
                text: nextWeekPlan,
                spacing: { after: 200 }
              }),
              new Paragraph({
                text: `创建时间：${new Date(report.createdAt).toLocaleString()}`,
                alignment: 'right'
              }),
              new Paragraph({
                text: '----------------------------------------',
                alignment: 'center'
              })
            ];
          }).flat()
        ]
      }]
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `weekly-reports-${new Date().toISOString().split('T')[0]}.docx`)
    ElMessage.success('周报导出成功')
  } catch (error) {
    console.error('导出错误:', error)
    ElMessage.error('周报导出失败')
  }
}

// 解析 Word 文档内容
const parseWordContent = async (file: File): Promise<WeeklyReport[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const result = await mammoth.convertToHtml({ arrayBuffer })
        const html = result.value

        // 解析 HTML 内容
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const reports: WeeklyReport[] = []

        // 获取所有文本内容
        const textContent = doc.body.textContent || ''
        console.log('原始文本内容:', textContent) // 调试日志

        // 处理内容
        const processContent = (content: string) => {
          return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .join('\n')
        }

        // 获取当前日期
        const now = new Date()
        const year = now.getFullYear()
        const weekNumber = getWeekNumber(now)

        // 创建周报对象，使用新结构
        const content: WeeklyReportContent = {
          accomplishments: processContent(textContent),
          challenges: '',
          nextWeekPlan: '',
          completionRate: 75
        }

        const report: WeeklyReport = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: `${year}年 第${weekNumber}周`,
          content: content,
          weekNumber,
          year,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        reports.push(report)
        console.log('解析结果:', reports) // 调试日志

        // 验证解析结果
        if (reports.length === 0) {
          throw new Error('未找到有效的周报内容')
        }

        resolve(reports)
      } catch (error) {
        console.error('解析错误:', error)
        reject(new Error(`文档解析失败：${error instanceof Error ? error.message : '未知错误'}`))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

// 获取当前是第几周
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// 导入周报
const handleImport = async (file: any) => {
  try {
    let reports: WeeklyReport[] = []
    const fileExtension = file.raw.name.split('.').pop()?.toLowerCase()

    switch (fileExtension) {
      case 'json':
        reports = await importJson(file.raw)
        break
      case 'docx':
        reports = await importDocx(file.raw)
        break
      case 'txt':
        reports = await importTxt(file.raw)
        break
      case 'csv':
        reports = await importCsv(file.raw)
        break
      default:
        throw new Error('不支持的文件格式，请使用 .json、.docx、.txt 或 .csv 文件')
    }

    // 验证导入的数据格式
    if (!Array.isArray(reports) || reports.length === 0) {
      throw new Error('导入的数据格式不正确或为空')
    }

    // 验证每个周报的必填字段
    const isValid = reports.every(report => 
      report.title && 
      report.content && 
      report.weekNumber && 
      report.year
    )

    if (!isValid) {
      throw new Error('导入的数据格式不正确，请确保所有周报都包含必要的字段')
    }

    ElMessageBox.confirm(
      `确定要导入 ${reports.length} 条周报数据吗？这将覆盖现有的周报数据。`,
      '导入确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      reportStore.clearAllReports()
      reports.forEach(report => {
        // 确保content是对象格式
        const content = typeof report.content === 'string'
          ? { 
              accomplishments: report.content,
              challenges: '',
              nextWeekPlan: '',
              completionRate: 75
            }
          : report.content
          
        reportStore.addReport({
          title: report.title,
          content: content,
          weekNumber: report.weekNumber,
          year: report.year
        })
      })
      ElMessage.success(`成功导入 ${reports.length} 条周报数据`)
    }).catch(() => {
      ElMessage.info('已取消导入')
    })
  } catch (error) {
    console.error('导入错误:', error)
    ElMessage.error(`导入失败：${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 导入 JSON 文件
const importJson = async (file: File): Promise<WeeklyReport[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        let data = JSON.parse(content)
        
        // 确保数据是数组
        const reports = Array.isArray(data) ? data : [data]
        
        // 处理旧格式数据，确保content是对象格式
        const processedReports = reports.map(report => {
          // 如果content是字符串，转换为新格式
          if (typeof report.content === 'string') {
            report.content = {
              accomplishments: report.content,
              challenges: '',
              nextWeekPlan: '',
              completionRate: 75
            }
          }
          return report
        })
        
        resolve(processedReports)
      } catch (error) {
        reject(new Error('JSON 文件格式不正确'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// 导入 TXT 文件
const importTxt = async (file: File): Promise<WeeklyReport[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const reports: WeeklyReport[] = []
        let currentReport: Partial<WeeklyReport> | null = null
        let currentSection: 'progress' | 'plan' | null = null

        const lines = content.split('\n')
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue

          // 检查是否是新的周报标题
          const yearWeekMatch = trimmedLine.match(/(\d{4})年\s*第(\d+)周/)
          if (yearWeekMatch) {
            if (currentReport && currentReport.title && currentReport.content) {
              reports.push(currentReport as WeeklyReport)
            }
            currentReport = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              title: trimmedLine,
              content: '',
              weekNumber: parseInt(yearWeekMatch[2]),
              year: parseInt(yearWeekMatch[1]),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            currentSection = null
            continue
          }

          if (!currentReport) continue

          if (trimmedLine.includes('本周工作进展：')) {
            currentSection = 'progress'
            currentReport.content = '本周工作进展：\n'
            continue
          } else if (trimmedLine.includes('下周工作计划：')) {
            currentSection = 'plan'
            if (currentReport.content) {
              currentReport.content += '\n\n下周工作计划：\n'
            } else {
              currentReport.content = '下周工作计划：\n'
            }
            continue
          }

          if (currentSection && currentReport.content) {
            currentReport.content += trimmedLine + '\n'
          }
        }

        if (currentReport && currentReport.title && currentReport.content) {
          reports.push(currentReport as WeeklyReport)
        }

        if (reports.length === 0) {
          throw new Error('未找到有效的周报内容')
        }

        resolve(reports)
      } catch (error) {
        reject(new Error('TXT 文件格式不正确'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// 导入 CSV 文件
const importCsv = async (file: File): Promise<WeeklyReport[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const reports: WeeklyReport[] = []
        const lines = content.split('\n')
        
        // 跳过标题行
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const [title, year, weekNumber, content] = line.split(',').map(field => field.trim())
          if (!title || !year || !weekNumber || !content) continue

          const yearNum = parseInt(year)
          const weekNum = parseInt(weekNumber)
          if (isNaN(yearNum) || isNaN(weekNum)) continue

          reports.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title,
            content,
            weekNumber: weekNum,
            year: yearNum,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }

        if (reports.length === 0) {
          throw new Error('未找到有效的周报内容')
        }

        resolve(reports)
      } catch (error) {
        reject(new Error('CSV 文件格式不正确'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// 导入 Word 文档
const importDocx = async (file: File): Promise<WeeklyReport[]> => {
  return parseWordContent(file)
}

// 修改编辑方法，添加权限检查
const editReport = (report: WeeklyReport) => {
  if (!authStore.hasPermission(Permission.EDIT_REPORT)) {
    ElMessage.error('您没有编辑周报的权限')
    return
  }
  router.push(`/report/edit/${report.id}`)
}
</script>

<style scoped>
.report-list {
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

.report-count {
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.el-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.search-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  align-items: center;
}

.search-input {
  flex: 1;
}

.el-select {
  width: 120px;
}

.el-table {
  margin-top: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.report-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-title span {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 1.05em;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
}

.el-button-group {
  display: flex;
  gap: 8px;
}

.el-empty {
  margin-top: 40px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.el-table :deep(th.el-table__cell) {
  background-color: #f5f7fa;
  font-weight: 600;
  color: var(--text-primary);
}

.el-table :deep(.el-table__row) {
  transition: all 0.3s ease;
}

.el-table :deep(.el-table__row:hover > td.el-table__cell) {
  background-color: rgba(64, 158, 255, 0.05);
}

.el-tag {
  font-weight: 500;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    padding: 10px 0;
    gap: 10px;
  }
  
  .header-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .search-bar {
    flex-direction: column;
    width: 100%;
  }
  
  .search-input {
    width: 100%;
  }
  
  .el-table {
    margin-top: 15px;
  }
}
</style> 