import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

export interface DashboardStats {
  article_count: number
  published_count: number
  draft_count: number
  category_count: number
  tag_count: number
  comment_count: number
  total_views: number
  total_likes: number
  today_views: number
  weekly_views: number[]
  monthly_views: number[]
  top_articles: Array<{ id: string; title: string; view_count: number }>
  recent_comments: Array<{ id: string; content: string; article_title: string; username: string; created_at: string }>
}

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats>({
    article_count: 0,
    published_count: 0,
    draft_count: 0,
    category_count: 0,
    tag_count: 0,
    comment_count: 0,
    total_views: 0,
    total_likes: 0,
    today_views: 0,
    weekly_views: [],
    monthly_views: [],
    top_articles: [],
    recent_comments: []
  })
  const loading = ref(false)

  async function fetchStats() {
    loading.value = true
    try {
      const res: any = await api.get('/admin/stats')
      const data = res.data || res
      if (data) {
        stats.value = { ...stats.value, ...data }
      }
    } finally {
      loading.value = false
    }
  }

  return {
    stats,
    loading,
    fetchStats
  }
})