import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

export interface SiteInfo {
  site_name: string
  site_logo: string
  site_description: string
  author_name: string
  author_bio: string
  author_avatar: string | null
  author_email: string
}

export const useSiteStore = defineStore('site', () => {
  const info = ref<SiteInfo>({
    site_name: '',
    site_logo: '/logo.svg',
    site_description: '',
    author_name: '',
    author_bio: '',
    author_avatar: null,
    author_email: ''
  })
  const loaded = ref(false)

  async function fetchInfo() {
    try {
      const res: any = await api.get('/site/info')
      const data = res.data?.data || res.data || res
      info.value = {
        site_name: data?.site_name || '',
        site_logo: data?.site_logo || '/logo.svg',
        site_description: data?.site_description || '',
        author_name: data?.author_name || '',
        author_bio: data?.author_bio || '',
        author_avatar: data?.author_avatar || null,
        author_email: data?.author_email || ''
      }
      loaded.value = true
    } catch {
      // 静默失败，保留默认值
    }
  }

  function ensureLoaded() {
    if (!loaded.value) return fetchInfo()
    return Promise.resolve()
  }

  return { info, loaded, fetchInfo, ensureLoaded }
})
