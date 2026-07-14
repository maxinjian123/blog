import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchTags as getTags, fetchTagArticles as getTagArticles } from '@/services/api/tag'
import type { Tag, Article } from '@/types/models'

export const useTagStore = defineStore('tag', () => {
  const tags = ref<Tag[]>([])
  const total = ref(0)
  const tagArticles = ref<Article[]>([])
  const loading = ref(false)

  async function fetchTags(page = 1, pageSize = 100) {
    loading.value = true
    try {
      const res = await getTags({ page, pageSize })
      tags.value = res.list
      total.value = res.pagination.total
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchTagArticles(id: string, page = 1, pageSize = 10) {
    loading.value = true
    try {
      const res = await getTagArticles(id, page, pageSize)
      tagArticles.value = res.list
      total.value = res.pagination.total
      return res
    } finally {
      loading.value = false
    }
  }

  return { tags, total, tagArticles, loading, fetchTags, fetchTagArticles }
})
