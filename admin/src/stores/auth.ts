import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

interface User {
  id: number
  username: string
  email: string
  avatar: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('admin_token') || '')
  const user = ref<User | null>(null)

  function loadUser() {
    const saved = localStorage.getItem('admin_user')
    if (saved) {
      try {
        user.value = JSON.parse(saved)
      } catch {
        user.value = null
      }
    }
  }

  loadUser()

  async function login(username: string, password: string) {
    const res: any = await api.post('/auth/login', { username, password })
    const { token: newToken, user: userData } = res.data || res
    token.value = newToken
    user.value = userData
    localStorage.setItem('admin_token', newToken)
    localStorage.setItem('admin_user', JSON.stringify(userData))
    return res
  }

  async function fetchCurrentUser() {
    try {
      const res: any = await api.get('/auth/me')
      user.value = res.data || res
      localStorage.setItem('admin_user', JSON.stringify(user.value))
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  return {
    token,
    user,
    login,
    logout,
    fetchCurrentUser,
    loadUser
  }
})