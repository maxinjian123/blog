<script setup lang="ts">
import AiSummary from '@/components/article/AiSummary.vue'
import AiTranslate from '@/components/article/AiTranslate.vue'
import CommentSection from '@/components/article/CommentSection.vue'
import { useArticleSeo } from '@/composables/useSeo'
import { useArticleStore } from '@/stores/article'
import api from '@/utils/api'
import { LeftOutlined } from '@ant-design/icons-vue'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import Message from 'vue-m-message'
import { useRoute, useRouter } from 'vue-router'
import {useThemeStore} from "@/stores/theme.ts";

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const themeStore = useThemeStore()

const articleId = computed(() => route.params.id as string)
const likeLoading = ref(false)

const currentArticle = computed(() => articleStore.currentArticle)
const theme = computed(() => themeStore.theme)

useArticleSeo(currentArticle)

// 回到顶部
const showBackTop = ref(false)

function handleScroll() {
  showBackTop.value = window.scrollY > 300
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToComments() {
  const el = document.querySelector('.comment-section')
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function onArticleLike() {
  if (likeLoading.value) return
  likeLoading.value = true
  try {
    const res = await api.post(`/articles/${articleId.value}/like`)
    const data = res.data.data || res.data
    if (articleStore.currentArticle) {
      articleStore.currentArticle.like_count = data.like_count
    }
    Message.success('点赞成功')
  } catch (e: any) {
    Message.error(e?.response?.data?.message || '点赞失败')
  } finally {
    likeLoading.value = false
  }
}

onMounted(() => {
  articleStore.fetchArticle(articleId.value)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

watch(articleId, id => {
  articleStore.fetchArticle(id)
})

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="article-page mt-5 relative">
    <!-- 左侧固定操作栏 -->
    <div class="fixed left-8 bottom-1/2 translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-3">
      <button
        @click="scrollToComments"
        class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110 shadow-md relative"
        style="background: var(--color-card); color: var(--color-primary); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)"
        title="评论">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span v-if="articleStore.currentArticle?.comment_count" class="absolute -top-1 -right-1 min-w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1" style="background: var(--gradient-primary)">{{ articleStore.currentArticle.comment_count }}</span>
      </button>
      <button
        @click="onArticleLike"
        :disabled="likeLoading"
        class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110 shadow-md relative disabled:opacity-60 disabled:cursor-not-allowed"
        style="background: var(--color-card); color: var(--color-primary); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)"
        title="点赞文章">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <span v-if="articleStore.currentArticle?.like_count" class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1" style="background: var(--gradient-primary)">{{ articleStore.currentArticle.like_count }}</span>
      </button>
    </div>

    <!-- 回到顶部 -->
    <Transition name="fade">
      <button
        v-if="showBackTop"
        @click="scrollToTop"
        class="fixed right-6 bottom-24 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110 shadow-lg z-50"
        style="background: var(--gradient-primary); color: white; box-shadow: 0 4px 16px rgba(73, 177, 245, 0.35)"
        title="回到顶部">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </Transition>

    <div v-if="articleStore.currentArticle && !articleStore.loading">
      <button @click="goBack" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-lg transition-all duration-200 mb-6 border bg-transparent cursor-pointer hover:-translate-x-1" style="color: var(--color-text-secondary); border-color: var(--color-border)">
        <LeftOutlined />
        返回
      </button>

      <header class="mb-8">
        <span v-if="articleStore.currentArticle.category" class="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium mb-4" style="background-color: var(--color-primary-light); color: var(--color-primary)">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
          {{ articleStore.currentArticle.category }}
        </span>
        <h1 class="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight mb-4" style="color: var(--color-text)">
          {{ articleStore.currentArticle.title }}
        </h1>
        <div class="flex flex-wrap items-center gap-3 text-sm" style="color: var(--color-text-secondary)">
          <span v-if="articleStore.currentArticle.author" class="flex items-center gap-1.5 font-medium" style="color: var(--color-text)">
            <svg class="w-4 h-4" style="color: var(--color-primary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {{ articleStore.currentArticle.author }}
          </span>
          <span class="opacity-30 select-none">|</span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {{ formatDate(articleStore.currentArticle.created_at) }}
          </span>
          <span class="opacity-30 select-none">|</span>
          <span class="flex items-center gap-1" style="color: var(--color-primary)">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span class="font-medium">{{ articleStore.currentArticle.view_count || 0 }}</span> 阅读
          </span>
        </div>
      </header>

      <div v-if="articleStore.currentArticle.cover_image" class="rounded-sm overflow-hidden mb-8 border-0" style="box-shadow: var(--shadow-lg)">
        <img :src="articleStore.currentArticle.cover_image" :alt="articleStore.currentArticle.title" class="w-full block" />
      </div>

      <AiSummary :summary="articleStore.currentArticle.excerpt" class="mb-4" />

      <article v-if="articleStore.currentArticle.content_type === 'markdown'" class="article-content-markdown">
        <MdPreview :modelValue="articleStore.currentArticle.content" language="zh-CN" :show-code-row-number="false"
                   id="preview-only"
                   class="p-5!"
                   :theme="theme"
                   preview-theme="cyanosis" />
      </article>
      <article v-else class="article-content" v-html="articleStore.currentArticle.content"></article>

      <footer class="mt-10 pt-6 border-t" style="border-color: var(--color-border)">
        <div v-if="articleStore.currentArticle.tags?.length" class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium" style="color: var(--color-text)">标签：</span>

          <span
            v-for="tag in articleStore.currentArticle.tags"
            @click="() => router.push(`/tag/${tag.id}/${tag.name}`)"
            :key="tag.id"
            class="text-xs px-3 py-1 rounded-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 font-medium"
            style="background-color: var(--color-hover); color: var(--color-primary)">
            #{{ tag.name }}
          </span>
        </div>
      </footer>

      <hr class="section-divider my-8" />

      <AiTranslate :articleContent="articleStore.currentArticle.content" />

      <CommentSection :articleId="articleId" />
    </div>

    <div v-else-if="articleStore.loading" class="flex flex-col items-center justify-center py-20 gap-6">
      <div class="w-10 h-10 border-2 rounded-full animate-spin" style="border-color: var(--color-primary); border-top-color: transparent" />
      <p style="color: var(--color-text-secondary)">加载文章中...</p>
    </div>

    <div v-else-if="articleStore.error" class="text-center py-20">
      <svg class="w-16 h-16 mx-auto mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-primary)">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h2 class="text-xl font-bold mb-2" style="color: var(--color-text)">文章加载失败</h2>
      <p class="mb-6 text-sm" style="color: var(--color-text-secondary)">{{ articleStore.error }}</p>
      <button @click="goBack" class="px-6 py-2.5 rounded-xl text-sm font-medium text-white border-0 cursor-pointer transition-all duration-200 hover:shadow-md" style="background: var(--gradient-primary)">返回首页</button>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
