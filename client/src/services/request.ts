import axios from 'axios'
import { layer } from '@layui/layui-vue'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types/api'

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'blog-client',
  },
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    if (data.code !== 200 && data.code !== 201) {
      layer.msg(data.message || '请求失败', { icon: 2 })
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return response
  },
  (error) => {
    const { response } = error
    if (response) {
      const { status, data } = response
      if (status === 401) {
        localStorage.removeItem('token')
        layer.msg('登录已过期', { icon: 2 })
      } else if (status === 429) {
        layer.msg('请求过多，请稍后再试', { icon: 2 })
      } else {
        layer.msg(data?.message || `请求错误 (${status})`, { icon: 2 })
      }
    } else {
      layer.msg('网络连接失败，请检查网络', { icon: 2 })
    }
    return Promise.reject(error)
  }
)

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.get<ApiResponse<T>>(url, config)
  return response.data.data
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.post<ApiResponse<T>>(url, data, config)
  return response.data.data
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.put<ApiResponse<T>>(url, data, config)
  return response.data.data
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.delete<ApiResponse<T>>(url, config)
  return response.data.data
}

export default request
