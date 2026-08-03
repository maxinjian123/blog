import {ref, watch} from 'vue'

const THEME_STORAGE_KEY = 'admin_theme_dark'

// 暗黑模式开关：localStorage 持久化，并同步 <html data-theme> 供全局 CSS 变量切换
const isDark = ref(localStorage.getItem(THEME_STORAGE_KEY) === '1')

watch(isDark, (val) => {
  localStorage.setItem(THEME_STORAGE_KEY, val ? '1' : '0')
  document.documentElement.dataset.theme = val ? 'dark' : 'light'
}, {immediate: true})

export function useDarkMode() {
  function toggleDarkMode() {
    isDark.value = !isDark.value
  }

  return {
    isDark,
    toggleDarkMode
  }
}
