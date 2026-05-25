import axios from 'axios'
import Message from "vue-m-message";

const api = axios.create({
    baseURL: '/api/v1',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        // 标识为客户端请求
        config.headers['X-Client-Type'] = 'blog-client'
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
        }
        if (error.response?.status === 429) {
            Message.warning('请求过多，请稍后再试')
        }
        return Promise.reject(error)
    }
)

export default api