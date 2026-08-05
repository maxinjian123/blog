import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

export interface Article {
  id: string
  title: string
  content: string
  summary: string
  cover: string
  status: 'draft' | 'published'
  category_id: string | null
  tags: Array<{ id: string; name: string; slug: string }>
  author_id?: number
  view_count?: number
  like_count?: number
  featured?: boolean
  created_at?: string
  updated_at?: string
  category?: { id: string; name: string; slug: string }
}

export interface ArticleQuery {
  page: number
  pageSize: number
  keyword?: string
  status?: string
  category_id?: string
  tag_id?: string
  featured?: string
  sort?: string
}

export const useArticleStore = defineStore('article', () => {
  const articles = ref<Article[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentArticle = ref<Article | null>(null)

  async function fetchArticles(query: ArticleQuery) {
    loading.value = true
    try {
      const res: any = await api.get('/articles', { params: query })
      const payload = res.data || res
      articles.value = payload.rows || payload.list || []
      total.value = payload.count || payload.total || 0
    } finally {
      loading.value = false
    }
  }

  async function fetchArticle(id: string) {
    const res: any = await api.get(`/articles/${id}`)
    const payload = res.data || res
    currentArticle.value = payload as Article
    return currentArticle.value
  }

  async function createArticle(data: Record<string, any>) {
    const res: any = await api.post('/articles', data)
    const payload = res.data || res
    currentArticle.value = payload as Article
    return currentArticle.value
  }

  async function updateArticle(id: string, data: Record<string, any>) {
    const res: any = await api.put(`/articles/${id}`, data)
    const payload = res.data || res
    currentArticle.value = payload as Article
    return currentArticle.value
  }

  async function deleteArticle(id: string) {
    await api.delete(`/articles/${id}`)
  }

  async function deleteArticles(ids: string[]) {
    await api.post('/articles/batch-delete', { ids })
  }

  return {
    articles,
    total,
    loading,
    currentArticle,
    fetchArticles,
    fetchArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    deleteArticles
  }
})