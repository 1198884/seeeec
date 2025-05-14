import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface WeeklyReportContent {
  accomplishments: string
  challenges: string
  nextWeekPlan: string
  completionRate?: number
  weekStart?: string
  weekEnd?: string
}

export interface WeeklyReport {
  id: string
  title: string
  content: WeeklyReportContent
  weekNumber: number
  year: number
  createdAt: string
  updatedAt: string
}

// 从 localStorage 加载数据
const loadReports = (): WeeklyReport[] => {
  const savedReports = localStorage.getItem('weekly-reports')
  if (!savedReports) return []
  
  try {
    const reports = JSON.parse(savedReports)
    
    // 确保content是对象，处理历史数据
    return reports.map((report: any) => {
      // 如果content是字符串，尝试解析它
      if (typeof report.content === 'string') {
        try {
          report.content = JSON.parse(report.content)
        } catch (e) {
          // 如果解析失败，创建一个兜底的content对象
          report.content = {
            accomplishments: report.content || '',
            challenges: '',
            nextWeekPlan: ''
          }
        }
      }
      
      // 确保所有必要的字段都存在
      if (!report.content) {
        report.content = {
          accomplishments: '',
          challenges: '',
          nextWeekPlan: ''
        }
      }
      
      return report
    })
  } catch (e) {
    console.error('Failed to parse reports from localStorage', e)
    return []
  }
}

export const useReportStore = defineStore('report', () => {
  // 从 localStorage 加载初始数据
  const reports = ref<WeeklyReport[]>(loadReports())
  const currentReport = ref<WeeklyReport | null>(null)

  // 添加初始化方法（如果需要手动重新加载数据）
  const initializeReports = () => {
    reports.value = loadReports()
  }

  // 监听数据变化并保存到 localStorage
  watch(
    reports,
    (newReports) => {
      localStorage.setItem('weekly-reports', JSON.stringify(newReports))
    },
    { deep: true }
  )

  const addReport = (report: Omit<WeeklyReport, 'id' | 'createdAt' | 'updatedAt'>) => {
    // 确保report.content是一个对象而不是字符串
    const content = typeof report.content === 'string' 
      ? { accomplishments: report.content, challenges: '', nextWeekPlan: '' }
      : report.content

    const newReport: WeeklyReport = {
      ...report,
      content, // 使用处理后的content
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    reports.value.push(newReport)
    return newReport
  }

  // 更新周报，支持部分字段更新
  const updateReport = (id: string, reportData: Partial<WeeklyReport>) => {
    const index = reports.value.findIndex(report => report.id === id)
    if (index !== -1) {
      // 确保content是一个对象
      let updatedContent = reports.value[index].content
      
      if (reportData.content) {
        if (typeof reportData.content === 'string') {
          updatedContent = {
            accomplishments: reportData.content,
            challenges: '',
            nextWeekPlan: ''
          }
        } else {
          updatedContent = {
            ...updatedContent,
            ...reportData.content
          }
        }
      }
      
      reports.value[index] = {
        ...reports.value[index],
        ...reportData,
        content: updatedContent,
        updatedAt: new Date().toISOString()
      }
    }
  }

  const deleteReport = (id: string) => {
    const index = reports.value.findIndex(r => r.id === id)
    if (index !== -1) {
      reports.value.splice(index, 1)
    }
  }

  const getReport = (id: string) => {
    if (!id) return null;
    
    // 调试日志
    console.log('查找报告:', id);
    console.log('当前报告数量:', reports.value.length);
    
    // 查找报告
    const found = reports.value.find(r => r.id === id);
    
    // 调试日志
    if (found) {
      console.log('找到报告:', found.title);
    } else {
      console.log('未找到报告ID:', id);
    }
    
    return found || null;
  }

  // 清空所有数据的方法
  const clearAllReports = () => {
    reports.value = []
    localStorage.removeItem('weekly-reports')
  }

  // 返回方法
  return {
    reports,
    currentReport,
    addReport,
    updateReport,
    deleteReport,
    getReport,
    clearAllReports,
    initializeReports // 新增方法
  }
}) 