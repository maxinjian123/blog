<script lang="ts" setup>
import AiSummary from '@/components/article/AiSummary.vue'
import AiTranslate from '@/components/article/AiTranslate.vue'
import CommentSection from '@/components/article/CommentSection.vue'
import { useArticleSeo } from '@/composables/useSeo'
import { useArticleStore } from '@/stores/article'
import { useThemeStore } from '@/stores/theme.ts'
import api from '@/utils/api'
import { LeftOutlined, MenuOutlined } from '@ant-design/icons-vue'
import { MdCatalog, MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import Message from 'vue-m-message'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const themeStore = useThemeStore()

const articleId = computed(() => route.params.id!)
const likeLoading = ref(false)

const currentArticle = computed(() => articleStore.currentArticle)
const theme = computed(() => themeStore.theme)

const scrollElement = document.documentElement

const showToc = computed(() => {
  const article = articleStore.currentArticle
  return article && article.content_type === 'markdown' && article.catalog && article.catalog.length > 0
})

useArticleSeo(currentArticle)

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
  articleStore.fetchArticle(articleId.value as string)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

watch(articleId, id => {
  articleStore.fetchArticle(id as string)
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
  <div class="article-page mt-5">
    <!-- 左侧固定操作栏 -->
    <div class="fixed left-8 bottom-1/2 translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-3">
      <button
        class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110 shadow-md relative"
        style="background: var(--color-card); color: var(--color-primary); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)"
        title="评论"
        @click="scrollToComments">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span v-if="articleStore.currentArticle?.comment_count" class="absolute -top-1 -right-1 min-w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1" style="background: var(--gradient-primary)">{{ articleStore.currentArticle.comment_count }}</span>
      </button>
      <button
        :disabled="likeLoading"
        class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110 shadow-md relative disabled:opacity-60 disabled:cursor-not-allowed"
        style="background: var(--color-card); color: var(--color-primary); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)"
        title="点赞文章"
        @click="onArticleLike">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <span v-if="articleStore.currentArticle?.like_count" class="absolute -top-1 -right-1 min-w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1" style="background: var(--gradient-primary)">{{ articleStore.currentArticle.like_count }}</span>
      </button>
    </div>

    <!-- 回到顶部 -->
    <Transition name="fade">
      <button
        v-if="showBackTop"
        class="fixed right-6 bottom-24 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110 shadow-lg z-50"
        style="background: var(--gradient-primary); color: white; box-shadow: 0 4px 16px rgba(73, 177, 245, 0.35)"
        title="回到顶部"
        @click="scrollToTop">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </Transition>

    <!-- 加载中 -->
    <div v-if="articleStore.loading" class="flex flex-col items-center justify-center py-20 gap-6">
      <div class="w-10 h-10 border-2 rounded-full animate-spin" style="border-color: var(--color-primary); border-top-color: transparent" />
      <p style="color: var(--color-text-secondary)">加载文章中...</p>
    </div>

    <!-- 错误 -->
    <div v-else-if="articleStore.error" class="text-center py-20">
      <svg class="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-primary)" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
      <h2 class="text-xl font-bold mb-2" style="color: var(--color-text)">文章加载失败</h2>
      <p class="mb-6 text-sm" style="color: var(--color-text-secondary)">{{ articleStore.error }}</p>
      <button class="px-6 py-2.5 rounded-xl text-sm font-medium text-white border-0 cursor-pointer transition-all duration-200 hover:shadow-md" style="background: var(--gradient-primary)" @click="goBack">返回首页</button>
    </div>

      <!-- 文章内容：flex 布局，目录在左，内容在右 -->
      <div v-if="currentArticle" class="flex gap-8">
        <!-- 左侧目录：sticky 吸顶，只在大屏显示 -->
        <aside v-if="showToc" class="hidden lg:block shrink-0 relative!">
          <div class="fixed top-30 left-45 w-50">
            <h4 class="text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-1" style="color: var(--color-text); border-color: var(--color-border)">
              <MenuOutlined style="color: #49b1f5" />
              文章目录
            </h4>
            <MdCatalog :offset-top="100" :scroll-element="scrollElement" :theme="theme" editor-id="preview-only" />
          </div>
        </aside>
        <!-- 右侧内容 -->
        <div class="flex-1 min-w-0">
          <button class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-lg transition-all duration-200 mb-6 border bg-transparent cursor-pointer hover:-translate-x-1" style="color: var(--color-text-secondary); border-color: var(--color-border)" @click="goBack">
            <LeftOutlined />
            返回
          </button>

          <header class="mb-8">
          <span v-if="currentArticle.category" class="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium mb-4" style="background-color: var(--color-primary-light); color: var(--color-primary)">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
            {{ currentArticle.category }}
          </span>
            <h1 class="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight mb-4" style="color: var(--color-text)">
              {{ currentArticle.title }}
            </h1>
            <div class="flex flex-wrap items-center gap-3 text-sm" style="color: var(--color-text-secondary)">
            <span v-if="currentArticle.author" class="flex items-center gap-1.5 font-medium" style="color: var(--color-text)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary)" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {{ currentArticle.author }}
            </span>
              <span class="opacity-30 select-none">|</span>
              <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              {{ formatDate(currentArticle.created_at) }}
            </span>
              <span class="opacity-30 select-none">|</span>
              <span class="flex items-center gap-1" style="color: var(--color-primary)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span class="font-medium">{{ currentArticle.view_count || 0 }}</span> 阅读
            </span>
            </div>
          </header>

          <div v-if="currentArticle.cover_image" class="rounded-sm overflow-hidden mb-8 border-0" style="box-shadow: var(--shadow-lg)">
            <img :alt="currentArticle.title" :src="currentArticle.cover_image" class="w-full block" />
          </div>

          <AiSummary :summary="currentArticle.excerpt" class="mb-4" />

          <article v-if="currentArticle.content_type === 'markdown'" class="article-content-markdown">
            <MdPreview id="preview-only" :modelValue="currentArticle.content" :show-code-row-number="false" :theme="theme" class="p-5!" language="zh-CN" preview-theme="cyanosis" />
          </article>
          <article v-else class="article-content" v-html="currentArticle.content"></article>

          <footer class="mt-10 pt-6 border-t" style="border-color: var(--color-border)">
            <div v-if="currentArticle.tags?.length" class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-medium" style="color: var(--color-text)">标签：</span>
              <span
                  v-for="tag in currentArticle.tags"
                  :key="tag.id"
                  class="text-xs px-3 py-1 rounded-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 font-medium"
                  style="background-color: var(--color-hover); color: var(--color-primary)"
                  @click="() => router.push(`/tag/${tag.id}/${tag.name}`)">
              #{{ tag.name }}
            </span>
            </div>
          </footer>

          <hr class="section-divider my-8" />

          <AiTranslate :articleContent="currentArticle.content" />

          <CommentSection :articleId="articleId as string" />
        </div>
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

.toc-scroll {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  scrollbar-width: thin;
}

.toc-scroll :deep(.md-editor-catalog-item) {
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.toc-scroll :deep(.md-editor-catalog-active) {
  color: var(--color-primary);
  font-weight: 600;
}
</style>
