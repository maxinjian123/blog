import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCategories as getCategories } from '@/services/api/category'
import type { Category } from '@/types/models'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)

  async function fetchCategories() {
    loading.value = true
    try {
      const res = await getCategories()
      categories.value = res
      return res
    } finally {
      loading.value = false
    }
  }

  return { categories, loading, fetchCategories }
})
