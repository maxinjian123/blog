import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchSiteInfo as getSiteInfo } from '@/services/api/site'
import { fetchAnnouncements as getAnnouncements } from '@/services/api/announcement'
import type { SiteInfo, Announcement } from '@/types/models'

export const useSiteStore = defineStore('site', () => {
  const siteInfo = ref<SiteInfo | null>(null)
  const announcements = ref<Announcement[]>([])
  const loading = ref(false)

  async function fetchSiteInfo() {
    loading.value = true
    try {
      const res = await getSiteInfo()
      siteInfo.value = res
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchAnnouncements() {
    const res = await getAnnouncements()
    announcements.value = res
    return res
  }

  return { siteInfo, announcements, loading, fetchSiteInfo, fetchAnnouncements }
})
