<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useArticleStore } from '@/stores/article'
import ArticleCard from '@/components/article/ArticleCard.vue'

const route = useRoute()
const articleStore = useArticleStore()
const searchQuery = ref((route.query.q as string) || '')
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (searchQuery.value) {
    doSearch()
  } else {
    articleStore.fetchArticles({ page: 1, pageSize: 10 })
  }
})

watch(
  () => route.query.q,
  (newQ) => {
    searchQuery.value = (newQ as string) || ''
    if (searchQuery.value) doSearch()
  }
)

function doSearch() {
  articleStore.searchArticles(searchQuery.value)
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    articleStore.searchArticles(searchQuery.value.trim())
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleSearch()
}

function clearSearch() {
  searchQuery.value = ''
  articleStore.fetchArticles({ page: 1, pageSize: 10 })
  inputRef.value?.focus()
}
</script>

<template>
  <div class="search-page">
    <div class="flex items-center gap-3 mb-8 pt-2">
      <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)" />
      <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">搜索</h1>
    </div>

    <div class="flex gap-2 mb-8">
      <div class="flex-1 relative">
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          class="w-full px-4 py-3 pl-10 pr-10 text-sm rounded-xl outline-none transition-all duration-200 focus:shadow-sm"
          placeholder="搜索文章..."
          @keydown="handleKeydown"
          style="background-color: var(--color-card); color: var(--color-text); border: 1px solid var(--color-border)"
        />
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-text-secondary)">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full border-0 bg-transparent cursor-pointer opacity-30 hover:opacity-60 transition-opacity"
          style="color: var(--color-text-secondary)"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <button
        @click="handleSearch"
        class="px-6 py-3 rounded-xl text-sm font-medium text-white border-0 cursor-pointer transition-all duration-200 hover:shadow-md hover:opacity-95"
        style="background: var(--gradient-primary)"
      >
        搜索
      </button>
    </div>

    <div v-if="articleStore.loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-2 rounded-full animate-spin" style="border-color: var(--color-primary); border-top-color: transparent" />
    </div>

    <div v-else-if="articleStore.articles.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto mb-4 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color: var(--color-primary)">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <p class="text-lg font-medium" style="color: var(--color-text)">
        {{ searchQuery ? '未找到相关文章' : '输入关键词开始搜索' }}
      </p>
      <p v-if="searchQuery" class="text-sm mt-2" style="color: var(--color-text-secondary)">尝试使用其他关键词</p>
    </div>

    <div v-else class="animate-fade-in">
      <p class="text-sm mb-4 flex items-center gap-1.5" style="color: var(--color-text-secondary)">
        <svg class="w-3.5 h-3.5" style="color: var(--color-primary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        找到 <span class="font-semibold" style="color: var(--color-primary)">{{ articleStore.total }}</span> 篇相关文章
      </p>
      <div class="space-y-6">
        <router-link
          v-for="article in articleStore.articles"
          :key="article.id"
          :to="`/article/${article.id}`"
          class="block no-underline"
        >
          <ArticleCard :article="article" />
        </router-link>
      </div>
    </div>
  </div>
</template>