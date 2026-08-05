import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

export interface SiteStats {
  article_count: number
  category_count: number
  tag_count: number
  comment_count: number
  visitor_count: number
  running_days: number
  since: string
}

const DEFAULT_STATS: SiteStats = {
  article_count: 0,
  category_count: 0,
  tag_count: 0,
  comment_count: 0,
  visitor_count: 0,
  running_days: 0,
  since: ''
}

export const useStatsStore = defineStore('stats', () => {
  const stats = ref<SiteStats>({ ...DEFAULT_STATS })
  const loaded = ref(false)

  async function fetchStats() {
    try {
      const res: any = await api.get('/site/stats')
      const data = res.data?.data || res.data || res
      stats.value = {
        article_count: Number(data?.article_count) || 0,
        category_count: Number(data?.category_count) || 0,
        tag_count: Number(data?.tag_count) || 0,
        comment_count: Number(data?.comment_count) || 0,
        visitor_count: Number(data?.visitor_count) || 0,
        running_days: Number(data?.running_days) || 0,
        since: data?.since || ''
      }
      loaded.value = true
    } catch {
      // 静默失败，保留默认值
    }
  }

  function ensureLoaded() {
    if (!loaded.value) return fetchStats()
    return Promise.resolve()
  }

  return { stats, loaded, fetchStats, ensureLoaded }
})
