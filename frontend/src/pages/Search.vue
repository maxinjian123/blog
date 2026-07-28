<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/article'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const searchQuery = ref((route.query.q as string) || '')
const inputRef = ref<HTMLInputElement | null>(null)
const showHistory = ref(false)

// F6: 搜索历史（localStorage，最多5条）
const HISTORY_KEY = 'search-history'
const history = ref<string[]>([])

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) history.value = JSON.parse(raw).filter((x: any) => typeof x === 'string' && x).slice(0, 5)
  } catch { history.value = [] }
}

function saveHistory(query: string) {
  const q = query.trim()
  if (!q) return
  // 去重后放最前
  const next = [q, ...history.value.filter(h => h !== q)].slice(0, 5)
  history.value = next
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

function useHistoryItem(item: string) {
  searchQuery.value = item
  showHistory.value = false
  doSearch()
}

function clearHistory() {
  history.value = []
  localStorage.removeItem(HISTORY_KEY)
}

onMounted(() => {
  loadHistory()
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
  const q = searchQuery.value.trim()
  if (q) {
    saveHistory(q)
    articleStore.searchArticles(q)
  }
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    doSearch()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleSearch()
    showHistory.value = false
  }
}

function clearSearch() {
  searchQuery.value = ''
  articleStore.fetchArticles({ page: 1, pageSize: 10 })
  inputRef.value?.focus()
}

function onFocus() {
  loadHistory()
  showHistory.value = history.value.length > 0
}

function onBlur() {
  // 延迟关闭，允许点击历史项
  setTimeout(() => { showHistory.value = false }, 200)
}

// F6: 关键词高亮函数
const keyword = computed(() => searchQuery.value.trim())

function highlight(text: string): string {
  if (!keyword.value || !text) return text
  // 转义正则特殊字符
  const escaped = keyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${escaped})`, 'gi')
  return text.replace(re, '<mark class="search-highlight">$1</mark>')
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
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
          @focus="onFocus"
          @blur="onBlur"
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

        <!-- F6: 搜索历史下拉 -->
        <Transition name="fade">
          <div
            v-if="showHistory"
            class="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-lg"
            style="background: var(--color-card); border: 1px solid var(--color-border)"
          >
            <div class="flex items-center justify-between px-4 py-2 border-b" style="border-color: var(--color-border)">
              <span class="text-xs font-medium" style="color: var(--color-text-secondary)">搜索历史</span>
              <button @mousedown.prevent="clearHistory" class="text-xs cursor-pointer border-0 bg-transparent" style="color: var(--color-text-secondary)">清空</button>
            </div>
            <ul class="py-1">
              <li
                v-for="item in history"
                :key="item"
                @mousedown.prevent="useHistoryItem(item)"
                class="px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors hover:bg-[var(--color-hover)]"
                style="color: var(--color-text)"
              >
                <svg class="w-3.5 h-3.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {{ item }}
              </li>
            </ul>
          </div>
        </Transition>
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
          <!-- F6: 自定义卡片，支持关键词高亮 -->
          <article
            class="rounded-sm flex flex-col sm:flex-row items-stretch overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group"
            style="background-color: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)"
          >
            <div v-if="article.cover_image" class="sm:w-48 shrink-0 overflow-hidden">
              <img :src="article.cover_image" :alt="article.title" class="w-full h-full object-cover aspect-video sm:aspect-auto" loading="lazy" />
            </div>
            <div class="flex-1 p-5 flex flex-col">
              <h3
                class="text-base font-semibold mb-2 transition-colors group-hover:text-[var(--color-primary)]"
                style="color: var(--color-text)"
                v-html="highlight(article.title)"
              />
              <p
                v-if="article.excerpt"
                class="text-sm mb-3 line-clamp-2"
                style="color: var(--color-text-secondary)"
                v-html="highlight(article.excerpt)"
              />
              <div class="mt-auto flex items-center gap-3 text-xs" style="color: var(--color-text-secondary)">
                <span v-if="article.category" class="px-2 py-0.5 rounded" style="background: var(--color-hover); color: var(--color-primary)">{{ article.category }}</span>
                <span>{{ formatDate(article.created_at) }}</span>
                <span class="opacity-30">·</span>
                <span>{{ article.view_count }} 阅读</span>
                <span v-if="article.comment_count" class="opacity-30">·</span>
                <span v-if="article.comment_count">{{ article.comment_count }} 评论</span>
              </div>
            </div>
          </article>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

<!-- F6: 搜索关键词高亮（全局样式，确保 v-html 内容生效） -->
<style>
mark.search-highlight {
  background-color: rgba(255, 213, 79, 0.55);
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}
</style>
