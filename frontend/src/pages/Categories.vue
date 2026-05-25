<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

interface Category {
  id: number
  name: string
  slug: string
  article_count: number
}

const categories = ref<Category[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/categories')
    const data = res.data.data || res.data
    categories.value = Array.isArray(data) ? data : (data.list || [])
  } catch {
    categories.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="categories-page mt-5">
    <div class="flex items-center gap-3 mb-8 pt-2">
      <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)" />
      <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">分类</h1>
      <span v-if="!loading" class="text-sm font-medium px-2.5 py-0.5 rounded-full" style="background-color: var(--color-primary-light); color: var(--color-primary)">
        {{ categories.length }} 个
      </span>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-2 rounded-full animate-spin" style="border-color: var(--color-primary); border-top-color: transparent" />
    </div>

    <div v-else-if="categories.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto mb-4 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color: var(--color-primary)">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <p class="text-lg font-medium" style="color: var(--color-text)">暂无分类</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
      <router-link
        v-for="cat in categories"
        :key="cat.id"
        :to="`/category/${cat.id}/${cat.name}`"
        class="card-elevated p-5 no-underline group cursor-pointer !rounded-xl flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0" style="background: var(--gradient-primary)">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-base font-medium group-hover:text-primary transition-colors" style="color: var(--color-text)">{{ cat.name }}</span>
            <span class="text-xs mt-0.5" style="color: var(--color-text-secondary)">{{ cat.article_count || 0 }} 篇文章</span>
          </div>
        </div>
        <svg class="w-5 h-5 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary)">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </router-link>
    </div>
  </div>
</template>