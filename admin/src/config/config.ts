import { ref } from 'vue'
import { isElectron } from '@/utils/api'

// 客户端访问地址（站点根），用于「文章管理标题跳转」「评论管理跳转文章」等链接拼接：
// - Web 端：优先使用「系统设置 → 站点信息 → 站点地址(site_url)」（从后端 GET /api/v1/site/info 动态获取），
//   未配置时回退到当前页面 origin（生产同域部署）
// - 桌面端（Electron）：使用 .env.* 中配置的 VITE_APP_API_URL（.env.* 仅用于桌面端应用配置），
//   启动时通过 initClientBaseUrl 从 Electron 主进程读取覆盖
export const CLIENT_BASE_URL = ref<string>(
  isElectron
    ? (import.meta.env.VITE_APP_API_URL || '')
    : (typeof window !== 'undefined' ? window.location.origin : '')
)

let siteUrlLoaded = false

// Web 端：从后端系统设置加载站点地址（site_url）并覆盖 CLIENT_BASE_URL
async function loadSiteUrl() {
  if (siteUrlLoaded) return
  siteUrlLoaded = true
  try {
    const api = (await import('@/utils/api')).default
    const res: any = await api.get('/site/info')
    const info = res?.data || res
    // 仅在配置了站点地址时覆盖（未配置则保留回退值）
    if (info?.site_url) CLIENT_BASE_URL.value = info.site_url
  } catch {
    // 静默失败，保留当前值
  }
}

// 初始化客户端访问地址：
// - 桌面端（Electron）：从主进程读取 .env 中配置的 VITE_APP_API_URL
// - Web 端：从后端系统设置加载 site_url
export async function initClientBaseUrl() {
  if (isElectron) {
    try {
      const url = await (window as any).electronAPI?.getClientUrl?.()
      if (url) CLIENT_BASE_URL.value = url
    } catch {
      // 静默失败，保留初始值
    }
    return
  }
  await loadSiteUrl()
}
