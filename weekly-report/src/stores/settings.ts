import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface BasicSettings {
  systemName: string
  dateFormat: string
  language: string
  theme: 'light' | 'dark' | 'system'
}

export interface ReportSettings {
  defaultTemplate: string
  requiredFields: string[]
  autoSave: boolean
}

// 从 localStorage 加载设置
const loadBasicSettings = (): BasicSettings => {
  try {
    const saved = localStorage.getItem('basic-settings')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to parse basic settings from localStorage', e)
  }
  
  return {
    systemName: '周报管理系统',
    dateFormat: 'YYYY-MM-DD',
    language: 'zh-CN',
    theme: 'light'
  }
}

const loadReportSettings = (): ReportSettings => {
  try {
    const saved = localStorage.getItem('report-settings')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to parse report settings from localStorage', e)
  }
  
  return {
    defaultTemplate: 'standard',
    requiredFields: ['accomplishments', 'nextWeekPlan'],
    autoSave: true
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const basicSettings = ref<BasicSettings>(loadBasicSettings())
  const reportSettings = ref<ReportSettings>(loadReportSettings())

  // 监听数据变化并保存到 localStorage
  watch(
    basicSettings,
    (newSettings) => {
      localStorage.setItem('basic-settings', JSON.stringify(newSettings))
      
      // 应用主题
      document.documentElement.setAttribute('data-theme', newSettings.theme)
    },
    { deep: true }
  )
  
  watch(
    reportSettings,
    (newSettings) => {
      localStorage.setItem('report-settings', JSON.stringify(newSettings))
    },
    { deep: true }
  )

  // 恢复默认设置
  const resetToDefaults = () => {
    basicSettings.value = {
      systemName: '周报管理系统',
      dateFormat: 'YYYY-MM-DD',
      language: 'zh-CN',
      theme: 'light'
    }
    
    reportSettings.value = {
      defaultTemplate: 'standard',
      requiredFields: ['accomplishments', 'nextWeekPlan'],
      autoSave: true
    }
  }

  // 导入设置
  const importSettings = (importedBasic: BasicSettings, importedReport: ReportSettings) => {
    basicSettings.value = { ...importedBasic }
    reportSettings.value = { ...importedReport }
  }

  return {
    basicSettings,
    reportSettings,
    resetToDefaults,
    importSettings
  }
}) 