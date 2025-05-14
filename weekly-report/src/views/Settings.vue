<template>
  <div class="settings-page">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h2>系统设置</h2>
          <p>配置系统全局参数和选项</p>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本设置" name="basic">
          <el-form :model="basicSettings" label-width="120px">
            <el-form-item label="系统名称">
              <el-input v-model="basicSettings.systemName" />
            </el-form-item>
            
            <el-form-item label="周报日期格式">
              <el-select v-model="basicSettings.dateFormat" style="width: 100%">
                <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
                <el-option label="MM/DD/YYYY" value="MM/DD/YYYY" />
                <el-option label="DD/MM/YYYY" value="DD/MM/YYYY" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="默认语言">
              <el-select v-model="basicSettings.language" style="width: 100%">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="显示模式">
              <el-radio-group v-model="basicSettings.theme">
                <el-radio label="light">浅色模式</el-radio>
                <el-radio label="dark">深色模式</el-radio>
                <el-radio label="system">跟随系统</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="周报设置" name="report">
          <el-form :model="reportSettings" label-width="120px">
            <el-form-item label="默认周报模板">
              <el-select v-model="reportSettings.defaultTemplate" style="width: 100%">
                <el-option label="标准模板" value="standard" />
                <el-option label="简洁模板" value="simple" />
                <el-option label="详细模板" value="detailed" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="必填字段">
              <el-checkbox-group v-model="reportSettings.requiredFields">
                <el-checkbox label="accomplishments">本周成就</el-checkbox>
                <el-checkbox label="challenges">遇到的挑战</el-checkbox>
                <el-checkbox label="nextWeekPlan">下周计划</el-checkbox>
                <el-checkbox label="completionRate">完成率</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="自动保存">
              <el-switch v-model="reportSettings.autoSave" />
              <span class="setting-desc">启用后每30秒自动保存编辑中的周报</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="数据管理" name="data">
          <div class="data-management">
            <h3>数据导入导出</h3>
            <p>您可以导出系统数据进行备份，或导入之前的备份数据</p>
            
            <div class="action-buttons">
              <el-button type="primary" @click="exportData">
                <el-icon><Download /></el-icon>导出数据
              </el-button>
              <el-button type="success" @click="importDialogVisible = true">
                <el-icon><Upload /></el-icon>导入数据
              </el-button>
            </div>
            
            <el-divider />
            
            <h3>数据重置</h3>
            <p class="warning-text">危险操作：重置将清除所有系统数据，此操作不可恢复</p>
            
            <el-button type="danger" @click="confirmReset">
              <el-icon><Delete /></el-icon>重置系统数据
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <div class="settings-actions">
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
        <el-button @click="resetSettings">重置</el-button>
      </div>
    </el-card>
    
    <!-- 导入数据对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入数据" width="500px">
      <div class="import-dialog">
        <el-upload
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
          accept=".json"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              请上传JSON格式的备份文件
            </div>
          </template>
        </el-upload>
        
        <div class="warning-box" v-if="selectedFile">
          <el-alert
            title="导入数据将覆盖当前数据，请确认操作"
            type="warning"
            show-icon
          />
          <p>已选择文件: {{ selectedFile.name }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="importData" :disabled="!selectedFile">
            确认导入
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Download, Upload, Delete, UploadFilled } from '@element-plus/icons-vue'
import { useReportStore } from '../stores/report'
import { useAuthStore, Permission } from '../stores/auth'
import { useThemeStore } from '../stores/theme'

const authStore = useAuthStore()
const reportStore = useReportStore()
const themeStore = useThemeStore()

// 确保用户有权限访问此页面
if (!authStore.hasPermission(Permission.MANAGE_USERS)) {
  ElMessage.error('您没有权限访问此页面')
}

const activeTab = ref('basic')
const importDialogVisible = ref(false)
const selectedFile = ref<File | null>(null)

// 加载保存的设置
const loadSettings = () => {
  try {
    const savedBasicSettings = localStorage.getItem('basic-settings')
    const savedReportSettings = localStorage.getItem('report-settings')
    
    if (savedBasicSettings) {
      Object.assign(basicSettings, JSON.parse(savedBasicSettings))
    }
    
    if (savedReportSettings) {
      Object.assign(reportSettings, JSON.parse(savedReportSettings))
    }
  } catch (error) {
    console.error('加载设置失败:', error)
    ElMessage.error('设置加载失败，将使用默认设置')
  }
}

// 基本设置
const basicSettings = reactive({
  systemName: '周报管理系统',
  dateFormat: 'YYYY-MM-DD',
  language: 'zh-CN',
  get theme() {
    return themeStore.currentTheme
  },
  set theme(value) {
    themeStore.setTheme(value)
  }
})

// 周报设置
const reportSettings = reactive({
  defaultTemplate: 'standard',
  requiredFields: ['accomplishments', 'nextWeekPlan'],
  autoSave: true
})

// 保存设置
const saveSettings = () => {
  try {
    localStorage.setItem('basic-settings', JSON.stringify(basicSettings))
    localStorage.setItem('report-settings', JSON.stringify(reportSettings))
    ElMessage.success('设置已保存')
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

// 重置设置
const resetSettings = () => {
  ElMessageBox.confirm(
    '确定要重置所有设置到默认值吗？',
    '重置确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    Object.assign(basicSettings, {
      systemName: '周报管理系统',
      dateFormat: 'YYYY-MM-DD',
      language: 'zh-CN',
      theme: 'light'
    })
    
    Object.assign(reportSettings, {
      defaultTemplate: 'standard',
      requiredFields: ['accomplishments', 'nextWeekPlan'],
      autoSave: true
    })
    
    ElMessage.success('设置已重置为默认值')
  }).catch(() => {
    // 取消操作
  })
}

// 数据导出
const exportData = () => {
  try {
    const exportData = {
      reports: localStorage.getItem('weekly-reports') ? JSON.parse(localStorage.getItem('weekly-reports') || '[]') : [],
      users: authStore.getAllUsers(),
      settings: {
        basic: basicSettings,
        report: reportSettings
      },
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileName = `weekly-report-backup-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileName)
    linkElement.click()
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('数据导出失败:', error)
    ElMessage.error('数据导出失败')
  }
}

// 处理文件选择
const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
}

// 数据导入
const importData = () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target?.result as string)
      
      // 验证导入数据的结构
      if (!importedData.reports || !importedData.settings) {
        throw new Error('导入的数据格式无效')
      }
      
      // 导入周报数据
      if (Array.isArray(importedData.reports)) {
        localStorage.setItem('weekly-reports', JSON.stringify(importedData.reports))
      }
      
      // 导入设置
      if (importedData.settings.basic) {
        Object.assign(basicSettings, importedData.settings.basic)
        localStorage.setItem('basic-settings', JSON.stringify(importedData.settings.basic))
      }
      
      if (importedData.settings.report) {
        Object.assign(reportSettings, importedData.settings.report)
        localStorage.setItem('report-settings', JSON.stringify(importedData.settings.report))
      }
      
      ElMessage.success('数据导入成功')
      importDialogVisible.value = false
      
      // 提示用户刷新页面以应用更改
      ElMessageBox.confirm(
        '数据已成功导入，是否刷新页面以应用更改？',
        '导入成功',
        {
          confirmButtonText: '刷新页面',
          cancelButtonText: '稍后刷新',
          type: 'success',
        }
      ).then(() => {
        window.location.reload()
      }).catch(() => {
        // 用户选择稍后刷新
      })
      
    } catch (error) {
      console.error('数据导入失败:', error)
      ElMessage.error('数据导入失败，请确保文件格式正确')
    }
  }
  
  reader.readAsText(selectedFile.value)
}

// 确认重置系统数据
const confirmReset = () => {
  ElMessageBox.confirm(
    '此操作将清除所有周报数据和自定义设置，但保留用户账号信息。此操作不可恢复，是否继续？',
    '数据重置警告',
    {
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
      type: 'danger',
      distinguishCancelAndClose: true,
    }
  ).then(() => {
    // 二次确认
    ElMessageBox.prompt('请输入"CONFIRM"以确认重置操作', '安全确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /^CONFIRM$/,
      inputErrorMessage: '请输入正确的确认文本',
      type: 'warning'
    }).then(({ value }) => {
      if (value === 'CONFIRM') {
        // 执行重置
        reportStore.clearAllReports()
        
        // 重置设置
        localStorage.removeItem('basic-settings')
        localStorage.removeItem('report-settings')
        
        // 重新加载默认值
        loadSettings()
        
        ElMessage.success('系统数据已重置')
      }
    }).catch(() => {
      // 取消操作
    })
  }).catch(() => {
    // 取消操作
  })
}

// 加载保存的设置
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-page {
  padding: 20px;
}

.settings-card {
  max-width: 900px;
  margin: 0 auto;
  border-radius: 12px;
}

.card-header {
  display: flex;
  flex-direction: column;
}

.card-header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--text-primary);
}

.card-header p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.setting-desc {
  margin-left: 10px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.settings-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.data-management {
  padding: 10px 0;
}

.data-management h3 {
  margin-top: 0;
  color: var(--text-primary);
}

.data-management p {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.warning-text {
  color: #f56c6c;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.import-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.warning-box {
  margin-top: 16px;
}

.warning-box p {
  margin: 10px 0 0;
  font-size: 0.9rem;
}
</style> 