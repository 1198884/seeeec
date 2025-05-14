import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

type Theme = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
  // 初始化主题
  const getInitialTheme = (): Theme => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      return savedTheme
    }
    // 检查系统主题
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const currentTheme = ref<Theme>(getInitialTheme())

  // 应用主题到 HTML 元素
  const applyTheme = (theme: Theme) => {
    let effectiveTheme = theme
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme)
    localStorage.setItem('theme', theme)
  }

  // 监听主题变化
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
  }, { immediate: true })

  // 监听系统主题变化
  const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemThemeQuery.addEventListener('change', (e) => {
    if (currentTheme.value === 'system') {
      applyTheme('system')
    }
  })

  // 切换主题
  const toggleTheme = () => {
    const themeMap: Record<Theme, Theme> = {
      'light': 'dark',
      'dark': 'system',
      'system': 'light'
    }
    currentTheme.value = themeMap[currentTheme.value]
  }

  // 设置指定主题
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
  }

  return {
    currentTheme,
    toggleTheme,
    setTheme
  }
}) 