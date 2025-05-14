<template>
  <div class="weather-widget">
    <el-card class="weather-card" :body-style="{ padding: '0px' }">
      <div class="weather-header">
        <h3>今日天气</h3>
        <el-button type="text" @click="refreshWeather" :loading="loading">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      
      <div v-if="weather" class="weather-content">
        <div class="weather-main">
          <div class="weather-icon">
            <el-icon v-if="isSunny"><Sunny /></el-icon>
            <el-icon v-else-if="isCloudy"><Cloudy /></el-icon>
            <el-icon v-else-if="isRainy"><Lightning /></el-icon>
            <el-icon v-else><Umbrella /></el-icon>
          </div>
          <div class="weather-temp">{{ weather.temperature }}°C</div>
        </div>
        
        <div class="weather-details">
          <div class="weather-detail-item">
            <el-icon><Wind /></el-icon>
            <span>{{ weather.windSpeed }} km/h</span>
          </div>
          <div class="weather-detail-item">
            <el-icon><Opportunity /></el-icon>
            <span>{{ weather.humidity }}%</span>
          </div>
        </div>
        
        <div class="weather-location">
          <el-icon><Location /></el-icon>
          <span>{{ weather.location }}</span>
        </div>
        
        <div class="weather-time">
          <small>更新于: {{ formatDate(weather.updated) }}</small>
        </div>
      </div>
      
      <div v-else-if="loading" class="weather-loading">
        <el-skeleton animated :rows="3" />
      </div>
      
      <div v-else class="weather-error">
        <el-empty description="无法获取天气数据">
          <el-button size="small" @click="refreshWeather">重试</el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Sunny, Cloudy, Lightning, Umbrella, 
  Refresh, Location, Wind, Opportunity
} from '@element-plus/icons-vue'

interface WeatherData {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  updated: Date
}

const weather = ref<WeatherData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// 判断天气类型的计算属性
const isSunny = computed(() => 
  weather.value?.condition.toLowerCase().includes('sunny') || 
  weather.value?.condition.toLowerCase().includes('clear')
)

const isCloudy = computed(() => 
  weather.value?.condition.toLowerCase().includes('cloud') || 
  weather.value?.condition.toLowerCase().includes('overcast')
)

const isRainy = computed(() => 
  weather.value?.condition.toLowerCase().includes('rain') || 
  weather.value?.condition.toLowerCase().includes('shower') ||
  weather.value?.condition.toLowerCase().includes('drizzle')
)

// 格式化日期
const formatDate = (date: Date) => {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取天气数据
const fetchWeather = async () => {
  loading.value = true
  error.value = null
  
  try {
    // 模拟API调用，实际项目中应该调用真实的天气API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 生成随机天气数据
    const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Thunderstorm']
    const locations = ['北京', '上海', '广州', '深圳', '杭州']
    
    weather.value = {
      location: locations[Math.floor(Math.random() * locations.length)],
      temperature: Math.floor(Math.random() * 15) + 15, // 15-30度
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
      updated: new Date()
    }
    
    // 存储到localStorage以便刷新后保留
    localStorage.setItem('weather-data', JSON.stringify(weather.value))
  } catch (e) {
    console.error('获取天气数据失败:', e)
    error.value = '获取天气数据失败'
  } finally {
    loading.value = false
  }
}

// 刷新天气
const refreshWeather = () => {
  fetchWeather()
}

// 从localStorage加载数据
const loadSavedWeather = () => {
  const savedData = localStorage.getItem('weather-data')
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      parsed.updated = new Date(parsed.updated)
      weather.value = parsed
    } catch (e) {
      console.error('解析保存的天气数据失败:', e)
    }
  }
}

onMounted(() => {
  loadSavedWeather()
  // 如果没有保存的数据或数据过期（超过1小时），则获取新数据
  if (!weather.value || (new Date().getTime() - new Date(weather.value.updated).getTime() > 3600000)) {
    fetchWeather()
  }
})
</script>

<style scoped>
.weather-widget {
  width: 100%;
}

.weather-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.weather-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.weather-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(90deg, #1890ff 0%, #36cfc9 100%);
  color: white;
}

.weather-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.weather-content {
  padding: 15px;
}

.weather-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.weather-icon {
  font-size: 4rem;
  color: #1890ff;
}

.weather-temp {
  font-size: 2.5rem;
  font-weight: 600;
  color: #303133;
}

.weather-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 10px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.weather-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.weather-location {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #303133;
  font-weight: 500;
}

.weather-time {
  text-align: right;
  color: #909399;
  font-size: 12px;
}

.weather-loading, .weather-error {
  padding: 20px;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> 