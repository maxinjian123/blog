import axios from 'axios'
import { message } from 'ant-design-vue'
import router from '@/router'

// localStorage 缓存 key
const API_BASE_URL_KEY = 'admin_api_base_url'

// 是否为 Electron 桌面端环境
export const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI

// 获取缓存的 API 基础地址
function getStoredApiBaseUrl(): string {
  return localStorage.getItem(API_BASE_URL_KEY) || ''
}

// 构造 baseURL：桌面端用缓存的远程地址，Web 端用相对路径（走 vite proxy）
function resolveBaseURL(): string {
  if (isElectron) {
    return getStoredApiBaseUrl() || ''  // 空字符串时需弹配置窗
  }
  return '/api/v1'
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 600000
})

// 运行时设置 API 基础地址（桌面端首次配置或设置页修改时调用）
export async function applyApiBaseUrl(url: string) {
  const cleanUrl = url.trim().replace(/\/+$/, '')  // 去掉末尾斜杠
  const fullUrl = cleanUrl ? `${cleanUrl}/api/v1` : '/api/v1'
  api.defaults.baseURL = fullUrl
  localStorage.setItem(API_BASE_URL_KEY, cleanUrl)
  return fullUrl
}

// 从 Electron 主进程加载配置并应用
export async function loadApiBaseUrlFromElectron(): Promise<string> {
  if (!isElectron) return '/api/v1'
  const stored = (window as any).electronAPI.getApiBaseUrl?.() as Promise<string>
  const url = await (stored || Promise.resolve(''))
  if (url) {
    await applyApiBaseUrl(url)
    return url
  }
  return ''
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    // 检测后端滑动续期返回的新 token，自动更新本地存储
    const newToken = response.headers['x-new-token']
    if (newToken) {
      localStorage.setItem('admin_token', newToken)
    }
    return response.data
  },
  (error) => {
    const { response } = error
    if (response) {
      const { status, data } = response
      if (status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        router.push('/login')
        message.error('登录已过期，请重新登录')
      } else if (status === 403) {
        message.error('没有权限执行此操作')
      } else if (status === 404) {
        message.error('请求的资源不存在')
      } else if (status === 500) {
        message.error(data?.message || '服务器内部错误')
      } else {
        message.error(data?.message || `请求错误 (${status})`)
      }
    } else {
      message.error('网络连接失败，请检查后端服务是否启动')
    }
    return Promise.reject(error)
  }
)

export default api
