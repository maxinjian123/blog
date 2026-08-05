<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArticleStore } from '@/stores/article'
import ArticleCard from '@/components/article/ArticleCard.vue'

const props = withDefaults(defineProps<{
  pageSize?: number
}>(), {
  pageSize: 10,
})

const articleStore = useArticleStore()
const currentPage = ref(1)
const layout = ref<'card' | 'list'>('card')

const totalPages = computed(() => Math.max(1, Math.ceil(articleStore.total / props.pageSize)))

const gridClass = computed(() =>
  layout.value === 'card'
    ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
    : 'flex flex-col gap-4'
)

onMounted(() => {
  const saved = localStorage.getItem('blog-home-layout') as 'card' | 'list' | null
  if (saved === 'card' || saved === 'list') {
    layout.value = saved
  }
  articleStore.fetchArticles({ page: currentPage.value, pageSize: props.pageSize })
})

watch(() => props.pageSize, (size) => {
  currentPage.value = 1
  articleStore.fetchArticles({ page: 1, pageSize: size })
})

function setLayout(value: 'card' | 'list') {
  layout.value = value
  localStorage.setItem('blog-home-layout', value)
}

function goToPage(page: number) {
  currentPage.value = page
  articleStore.fetchArticles({ page, pageSize: props.pageSize })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)"/>
        <h2 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">文章</h2>
        <span class="text-sm font-medium px-2.5 py-0.5 rounded-full"
              style="background-color: var(--color-primary-light); color: var(--color-primary)">
          {{ articleStore.total }} 篇
        </span>
      </div>

      <div class="flex items-center gap-1.5 p-1 rounded-lg"
           style="background-color: var(--color-card); border: 1px solid var(--color-border)">
        <button
          type="button"
          aria-label="卡片视图"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer border-0"
          :style="{
            background: layout === 'card' ? 'var(--gradient-primary)' : 'transparent',
            color: layout === 'card' ? '#fff' : 'var(--color-text-secondary)',
          }"
          @click="setLayout('card')"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          卡片
        </button>
        <button
          type="button"
          aria-label="列表视图"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer border-0"
          :style="{
            background: layout === 'list' ? 'var(--gradient-primary)' : 'transparent',
            color: layout === 'list' ? '#fff' : 'var(--color-text-secondary)',
          }"
          @click="setLayout('list')"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          列表
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="articleStore.loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="i in 6" :key="i" class="rounded-xl overflow-hidden" style="border: 1px solid var(--color-border)">
        <div class="skeleton aspect-video"/>
        <div class="p-5 space-y-3">
          <div class="skeleton h-4 w-24"/>
          <div class="skeleton h-5 w-3/4"/>
          <div class="skeleton h-4 w-full"/>
          <div class="skeleton h-4 w-1/2"/>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="articleStore.articles.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color: var(--color-primary)">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p class="text-lg font-medium mb-2" style="color: var(--color-text)">暂无文章</p>
      <p class="text-sm" style="color: var(--color-text-secondary)">还没有发布任何文章</p>
    </div>

    <!-- List -->
    <div
      v-else
      class="animate-fade-in"
      :class="gridClass"
    >
      <router-link
        v-for="(article, idx) in articleStore.articles"
        :key="article.id"
        :to="`/article/${article.id}`"
        class="block no-underline"
        :style="{ animationDelay: `${idx * 40}ms` }"
      >
        <ArticleCard :article="article" :layout="layout"/>
      </router-link>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-1.5 mt-10">
      <button
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all duration-200 border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        style="background-color: var(--color-card); color: var(--color-text-secondary); border: 1px solid var(--color-border)"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button
        v-for="p in totalPages"
        :key="p"
        @click="goToPage(p)"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 border-0 cursor-pointer"
        :style="{
          background: p === currentPage ? 'var(--gradient-primary)' : 'var(--color-card)',
          color: p === currentPage ? '#fff' : 'var(--color-text-secondary)',
          border: p === currentPage ? 'none' : '1px solid var(--color-border)',
          boxShadow: p === currentPage ? 'var(--shadow-sm)' : 'none',
        }"
      >
        {{ p }}
      </button>
      <button
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all duration-200 border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        style="background-color: var(--color-card); color: var(--color-text-secondary); border: 1px solid var(--color-border)"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  </div>
</template>
