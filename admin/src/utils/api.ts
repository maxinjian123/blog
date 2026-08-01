import axios from 'axios'
import { message } from 'ant-design-vue'
import router from '@/router'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 600000
})

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
      message.error('网络连接失败，请检查网络')
    }
    return Promise.reject(error)
  }
)

export default api