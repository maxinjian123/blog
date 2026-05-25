<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

interface ArchiveArticle {
  id: number
  title: string
  published_at: string
}

interface MonthGroup {
  month: number
  articles: ArchiveArticle[]
}

interface YearGroup {
  year: number
  months: MonthGroup[]
}

const archives = ref<YearGroup[]>([])
const total = ref(0)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/articles/archive')
    const data = res.data.data || res.data
    archives.value = data.archive || []
    total.value = data.total || 0
  } catch {
    archives.value = []
  } finally {
    loading.value = false
  }
})

function getMonthName(month: number): string {
  return `${month}月`
}
</script>

<template>
  <div class="archive-page mt-5">
    <div class="flex items-center gap-3 mb-8 pt-2">
      <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)" />
      <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">文章归档</h1>
      <span v-if="!loading" class="text-sm font-medium px-2.5 py-0.5 rounded-full" style="background-color: var(--color-primary-light); color: var(--color-primary)">
        {{ total }} 篇
      </span>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-2 rounded-full animate-spin" style="border-color: var(--color-primary); border-top-color: transparent" />
    </div>

    <div v-else-if="archives.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto mb-4 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color: var(--color-primary)">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <p class="text-lg font-medium" style="color: var(--color-text)">暂无归档文章</p>
    </div>

    <div v-else class="space-y-8 animate-fade-in">
      <section v-for="yearGroup in archives" :key="yearGroup.year">
        <h2 class="text-2xl font-extrabold mb-4 tracking-tight" style="color: var(--color-text)">
          {{ yearGroup.year }}
          <span class="text-sm font-normal ml-2 opacity-40">
            {{ yearGroup.months.reduce((acc, m) => acc + m.articles.length, 0) }} 篇
          </span>
        </h2>
        <div v-for="month in yearGroup.months" :key="month.month" class="ml-2 mb-4">
          <h3 class="text-sm font-semibold mb-2 flex items-center gap-2" style="color: var(--color-primary)">
            <span class="w-1.5 h-1.5 rounded-full inline-block" style="background: var(--gradient-primary)"></span>
            {{ getMonthName(month.month) }}
          </h3>
          <ul class="space-y-1 ml-4">
            <li v-for="article in month.articles" :key="article.id">
              <router-link
                :to="`/article/${article.id}`"
                class="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg transition-all duration-200 hover:translate-x-1 group"
                style="color: var(--color-text-secondary)"
              >
                <span class="shrink-0 text-xs opacity-50 font-mono">
                  {{ new Date(article.published_at).getDate() }}日
                </span>
                <span class="flex-1 group-hover:text-primary transition-colors line-clamp-1">{{ article.title }}</span>
              </router-link>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>