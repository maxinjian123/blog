import { ref } from 'vue'
import { isElectron } from '@/utils/api'

// 客户端访问地址（站点根）：
// - Web 端：优先用构建期注入的 VITE_CLIENT_BASE_URL（dev 用），缺省时回退到当前页面 origin（生产同域部署）
// - 桌面端（Electron）：启动时通过 initClientBaseUrl 从主进程读取 VUE_APP_API_URL 覆盖
export const CLIENT_BASE_URL = ref<string>(
  import.meta.env.VITE_CLIENT_BASE_URL
  || (!isElectron && typeof window !== 'undefined' ? window.location.origin : '')
)

// 桌面端启动时从 Electron 主进程加载客户端访问地址（VUE_APP_API_URL）
export async function initClientBaseUrl() {
  if (!isElectron) return
  try {
    const url = await (window as any).electronAPI?.getClientUrl?.()
    if (url) CLIENT_BASE_URL.value = url
  } catch {
    // 静默失败，保留初始值
  }
}
