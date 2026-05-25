<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useArticleStore } from '@/stores/article'
import ArticleCard from '@/components/article/ArticleCard.vue'
import { usePageSeo } from '@/composables/useSeo'

const articleStore = useArticleStore()
const currentPage = ref(1)
const pageSize = 10

usePageSeo({
  title: '首页',
  description: 'TechMind Blog - 个人技术博客，分享Vue、前端、全栈开发等技术文章',
  keywords: 'TechMind, Blog, Vue3, 前端开发, 全栈, 技术博客, TypeScript',
})

onMounted(() => {
  articleStore.fetchArticles({ page: currentPage.value, pageSize })
})

function goToPage(page: number) {
  currentPage.value = page
  articleStore.fetchArticles({ page, pageSize })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const totalPages = ref(1)
watch(() => articleStore.total, (t) => {
  totalPages.value = Math.max(1, Math.ceil(t / pageSize))
})
</script>

<template>
  <div class="home-page mt-5  ">
    <div class="flex items-center gap-3 mb-8 pt-2">
      <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)" />
      <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">文章</h1>
      <span class="text-sm font-medium px-2.5 py-0.5 rounded-full" style="background-color: var(--color-primary-light); color: var(--color-primary)">
        {{ articleStore.total }} 篇
      </span>
    </div>

    <div v-if="articleStore.loading" class="flex flex-col justify-center py-20 gap-6">
      <div v-for="i in 3" :key="i" class="rounded-xl overflow-hidden" style="border: 1px solid var(--color-border)">
        <div class="skeleton aspect-video" />
        <div class="p-5 space-y-3">
          <div class="skeleton h-4 w-24" />
          <div class="skeleton h-5 w-3/4" />
          <div class="skeleton h-4 w-full" />
          <div class="skeleton h-4 w-1/2" />
        </div>
      </div>
    </div>

    <div v-else-if="articleStore.articles.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color: var(--color-primary)">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <p class="text-lg font-medium mb-2" style="color: var(--color-text)">暂无文章</p>
      <p class="text-sm" style="color: var(--color-text-secondary)">还没有发布任何文章</p>
    </div>

    <div v-else class="space-y-6 animate-fade-in">
      <router-link
        v-for="(article, idx) in articleStore.articles"
        :key="article.id"
        :to="`/article/${article.id}`"
        class="block no-underline"
        :style="{ animationDelay: `${idx * 60}ms` }"
      >
        <ArticleCard :article="article" />
      </router-link>
    </div>

    <div v-if="totalPages > 1" class="flex justify-center gap-1.5 mt-10">
      <button
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all duration-200 border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        style="background-color: var(--color-card); color: var(--color-text-secondary); border: 1px solid var(--color-border)"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
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
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  </div>
</template>