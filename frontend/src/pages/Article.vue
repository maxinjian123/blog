<script lang="ts" setup>
import AiSummary from '@/components/article/AiSummary.vue'
import CommentSection from '@/components/article/CommentSection.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import BackToTop from '@/components/common/BackToTop.vue'
import {useArticleSeo} from '@/composables/useSeo'
import {useArticleStore} from '@/stores/article'
import {useThemeStore} from '@/stores/theme.ts'
import api from '@/utils/api'
import {LeftOutlined, MenuOutlined, UnorderedListOutlined} from '@ant-design/icons-vue'
import {MdCatalog, MdPreview} from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import Message from 'vue-m-message'
import {useRoute, useRouter} from 'vue-router'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const themeStore = useThemeStore()

const articleId = computed(() => route.params.id!)
const likeLoading = ref(false)
const showShareModal = ref(false)
const shareCount = ref(0)
const currentUrl = ref('')

const currentArticle = computed(() => articleStore.currentArticle)
const theme = computed(() => themeStore.theme)

const scrollElement = document.documentElement

// F2: 阅读进度条 + 阅读时间估算 + 阅读位置记忆
const readingProgress = ref(0)
const READ_POS_PREFIX = 'article-read-pos:'
let savePosTimer: number | undefined

const readingStats = computed(() => {
  const content = currentArticle.value?.content || ''
  if (!content) return {words: 0, minutes: 0}
  // 代码块行数（代码阅读更慢，单独按 15 行/分计入）
  const codeBlocks = content.match(/```[\s\S]*?```/g) || []
  const codeLines = codeBlocks.reduce((sum, b) => {
    const lines = b.split('\n').length - 2
    return sum + (lines > 0 ? lines : 0)
  }, 0)
  // 正文：剥离代码块/图片/链接语法后，统计所有非空白字符（含标点、数字，更贴近实际字数）
  const plain = content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_~\-]/g, '')
  const prose = plain.replace(/\s/g, '').length
  // 技术文正文约 250 字/分，代码约 15 行/分
  const minutes = prose + codeLines > 0 ? Math.max(1, Math.ceil(prose / 250 + codeLines / 15)) : 0
  return {words: prose, minutes}
})

function updateReadingProgress() {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  readingProgress.value = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0
}

function saveReadPosition() {
  if (savePosTimer) window.clearTimeout(savePosTimer)
  savePosTimer = window.setTimeout(() => {
    const id = articleId.value as string
    if (id && window.scrollY > 200) {
      localStorage.setItem(READ_POS_PREFIX + id, String(window.scrollY))
    }
  }, 400)
}

function restoreReadPosition() {
  // URL 携带 ?c=<commentId>（邮件通知跳转 / 评论定位）时，跳过位置记忆，让用户定位到指定评论
  if (route.query?.c) return
  const id = articleId.value as string
  if (!id) return
  const saved = localStorage.getItem(READ_POS_PREFIX + id)
  if (!saved) return
  const y = Number(saved)
  // 阈值提高到 600，避免短文也触发；静默恢复（无 Toast）
  if (!Number.isNaN(y) && y > 600) {
    setTimeout(() => {
      window.scrollTo({top: y, behavior: 'auto'})
      // 图片加载可能改变文档高度，二次校准
      setTimeout(() => {
        if (Math.abs(window.scrollY - y) > 50) {
          window.scrollTo({top: y, behavior: 'auto'})
        }
      }, 600)
    }, 500)
  }
}

const showToc = computed(() => {
  const article = articleStore.currentArticle
  return article && article.content_type === 'markdown' && article.catalog && article.catalog.length > 0
})

useArticleSeo(currentArticle)

const showTocDrawer = ref(false)

// F1 相关文章 / F3 上下篇
const relatedArticles = ref<Array<{
  id: string; title: string; excerpt: string; cover_image: string;
  category: string; tags: string[]; published_at: string; view_count: number
}>>([])
const neighbors = ref<{ prev: any | null; next: any | null }>({prev: null, next: null})

async function loadRelatedAndNeighbors(id: string) {
  const [related, neigh] = await Promise.all([
    articleStore.fetchRelated(id),
    articleStore.fetchNeighbors(id)
  ])
  relatedArticles.value = related as any
  neighbors.value = neigh as any
}

function handleScroll() {
  updateReadingProgress()
  saveReadPosition()
}

function scrollToComments() {
  const el = document.querySelector('.comment-section')
  el?.scrollIntoView({behavior: 'smooth', block: 'start'})
}

async function fetchShareCount() {
  try {
    const res = await api.get(`/articles/${articleId.value}/share-count`)
    const data = res.data.data || res.data
    shareCount.value = data.share_count || 0
  } catch (e) {
    console.error('获取分享次数失败', e)
  }
}

async function onArticleShare() {
  try {
    await api.post(`/articles/${articleId.value}/share`)
    shareCount.value++
    Message.success('分享记录成功')
  } catch (e: any) {
    Message.error(e?.response?.data?.message || '分享失败')
  }
}

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
    Message.success('链接已复制')
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    Message.success('链接已复制')
  }
}

function shareToWeibo() {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(currentArticle.value?.title || '')
  window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${title}`)
}

function shareToQQ() {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(currentArticle.value?.title || '')
  window.open(`https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`)
}

function shareToWechat() {
  Message.info('请复制链接后分享到微信')
  copyToClipboard(window.location.href)
}

function shareToX() {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(currentArticle.value?.title || '')
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`)
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
  fetchShareCount()
  currentUrl.value = window.location.href
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

watch(articleId, id => {
  // F1/F3: 切换文章时清空旧数据，避免闪烁
  relatedArticles.value = []
  neighbors.value = {prev: null, next: null}
  window.scrollTo({top: 0, behavior: 'auto'})
  articleStore.fetchArticle(id as string)
})

// F2: 文章加载完成后计算进度并恢复阅读位置；F1/F3 加载相关文章与上下篇
watch(currentArticle, article => {
  if (article) {
    nextTick(() => {
      updateReadingProgress()
      restoreReadPosition()
    })
    loadRelatedAndNeighbors(article.id)
  }
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
    <!-- F2: 阅读进度条 -->
    <div class="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none" aria-hidden="true">
      <div class="h-full transition-[width] duration-150 ease-out"
           :style="{ width: readingProgress + '%', background: 'var(--gradient-primary)' }"></div>
    </div>
    <!-- 左侧固定操作栏 -->
    <div class="fixed left-8 bottom-1/2 translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-3">
      <button
          class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110 shadow-md relative"
          style="background: var(--color-card); color: var(--color-primary); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)"
          title="评论"
          @click="scrollToComments">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span v-if="articleStore.currentArticle?.comment_count"
              class="absolute -top-1 -right-1 min-w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1"
              style="background: var(--gradient-primary)">{{ articleStore.currentArticle.comment_count }}</span>
      </button>
      <button
          :disabled="likeLoading"
          class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110 shadow-md relative disabled:opacity-60 disabled:cursor-not-allowed"
          style="background: var(--color-card); color: var(--color-primary); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)"
          title="点赞文章"
          @click="onArticleLike">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
              d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
        </svg>
        <span v-if="articleStore.currentArticle?.like_count"
              class="absolute -top-1 -right-1 min-w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1"
              style="background: var(--gradient-primary)">{{ articleStore.currentArticle.like_count }}</span>
      </button>
      <button
          class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110 shadow-md relative"
          style="background: var(--color-card); color: var(--color-primary); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)"
          title="分享文章"
          @click="showShareModal = true; onArticleShare()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
          <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
        </svg>
        <span v-if="shareCount"
              class="absolute -top-1 -right-1 min-w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1"
              style="background: var(--gradient-primary)">{{ shareCount }}</span>
      </button>
    </div>

    <!-- 回到顶部 -->
    <BackToTop :bottom="'6rem'" />

    <!-- F7: 移动端 TOC 浮动按钮（仅 < lg 显示） -->
    <button
        v-if="showToc"
        class="fixed left-5 bottom-24 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110 shadow-lg z-50 lg:hidden"
        style="background: var(--gradient-primary); color: white; box-shadow: 0 4px 16px rgba(73, 177, 245, 0.4)"
        title="文章目录"
        @click="showTocDrawer = true">
      <UnorderedListOutlined style="font-size: 20px"/>
    </button>

    <!-- F7: 移动端 TOC 抽屉 -->
    <Transition name="toc-slide">
      <div v-if="showTocDrawer" class="fixed inset-0 z-[70] lg:hidden" @click.self="showTocDrawer = false">
        <div class="absolute inset-0 bg-black/40" @click="showTocDrawer = false"/>
        <div class="absolute left-0 top-0 bottom-0 w-72 overflow-y-auto p-5 shadow-2xl"
             style="background: var(--color-card)">
          <div class="flex items-center justify-between mb-4 pb-2 border-b" style="border-color: var(--color-border)">
            <h4 class="text-sm font-semibold flex items-center gap-1.5" style="color: var(--color-text)">
              <MenuOutlined style="color: #49b1f5"/>
              文章目录
            </h4>
            <button class="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer border-0"
                    style="color: var(--color-text-secondary); background: transparent" @click="showTocDrawer = false">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <MdCatalog :offset-top="80" :scroll-element="scrollElement" :theme="theme" editor-id="preview-only"
                     class="toc-scroll" @click="showTocDrawer = false"/>
        </div>
      </div>
    </Transition>

    <!-- 加载中 -->
    <div v-if="articleStore.loading" class="flex flex-col items-center justify-center py-20 gap-6">
      <div class="w-10 h-10 border-2 rounded-full animate-spin"
           style="border-color: var(--color-primary); border-top-color: transparent"/>
      <p style="color: var(--color-text-secondary)">加载文章中...</p>
    </div>

    <!-- 错误 -->
    <div v-else-if="articleStore.error" class="text-center py-20">
      <svg class="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" stroke-width="1.5"
           style="color: var(--color-primary)" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" x2="12" y1="8" y2="12"/>
        <line x1="12" x2="12.01" y1="16" y2="16"/>
      </svg>
      <h2 class="text-xl font-bold mb-2" style="color: var(--color-text)">文章加载失败</h2>
      <p class="mb-6 text-sm" style="color: var(--color-text-secondary)">{{ articleStore.error }}</p>
      <button
          class="px-6 py-2.5 rounded-xl text-sm font-medium text-white border-0 cursor-pointer transition-all duration-200 hover:shadow-md"
          style="background: var(--gradient-primary)" @click="goBack">返回首页
      </button>
    </div>

    <!-- 文章内容：三栏布局，目录 | 内容 | 站点信息 -->
    <div v-if="currentArticle" class="flex gap-6 xl:gap-8">
      <!-- 左侧目录：sticky 吸顶，只在大屏显示 -->
      <aside v-if="showToc" class="hidden lg:block w-44 xl:w-52 shrink-0">
        <div class="sticky top-28">
          <h4 class="text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-1"
              style="color: var(--color-text); border-color: var(--color-border)">
            <MenuOutlined style="color: #49b1f5"/>
            文章目录
          </h4>
          <MdCatalog :offset-top="100" :scroll-element="scrollElement" :theme="theme" editor-id="preview-only"/>
        </div>
      </aside>
      <!-- 中间内容 -->
      <div class="flex-1 min-w-0">
        <button
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-lg transition-all duration-200 mb-6 border bg-transparent cursor-pointer hover:-translate-x-1"
            style="color: var(--color-text-secondary); border-color: var(--color-border)" @click="goBack">
          <LeftOutlined/>
          返回
        </button>

        <header class="mb-8">
          <span v-if="currentArticle.category"
                class="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium mb-4"
                style="background-color: var(--color-primary-light); color: var(--color-primary)">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path
                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            {{ currentArticle.category }}
          </span>
          <h1 class="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight mb-4"
              style="color: var(--color-text)">
            {{ currentArticle.title }}
          </h1>
          <div class="flex flex-wrap items-center gap-3 text-sm" style="color: var(--color-text-secondary)">
            <span v-if="currentArticle.author" class="flex items-center gap-1.5 font-medium"
                  style="color: var(--color-text)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"
                   style="color: var(--color-primary)" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {{ currentArticle.author }}
            </span>
            <span class="opacity-30 select-none">|</span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect height="18" rx="2" ry="2" width="18" x="3" y="4"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
              {{ formatDate(currentArticle.created_at) }}
            </span>
            <span class="opacity-30 select-none">|</span>
            <span class="flex items-center gap-1" style="color: var(--color-primary)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span class="font-medium">{{ currentArticle.view_count || 0 }}</span> 阅读
            </span>
            <span class="opacity-30 select-none">|</span>
            <span class="flex items-center gap-1" style="color: var(--color-text-secondary)">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span v-if="readingStats.minutes" class="font-medium">{{ readingStats.minutes }}</span> 分钟阅读
              </span>
            <span class="hidden md:flex items-center gap-1 text-xs" style="color: var(--color-text-secondary)">
                约 {{ readingStats.words }} 字
              </span>
          </div>
        </header>

        <div v-if="currentArticle.cover_image" class="rounded-sm overflow-hidden mb-8 border-0"
             style="box-shadow: var(--shadow-lg)">
          <img :alt="currentArticle.title" :src="currentArticle.cover_image" class="w-full block"/>
        </div>

        <AiSummary :summary="currentArticle.excerpt" class="mb-4"/>

        <article v-if="currentArticle.content_type === 'markdown'" class="article-content-markdown">
          <MdPreview id="preview-only" :modelValue="currentArticle.content" :show-code-row-number="false" :theme="theme"
                     class="p-5!" language="zh-CN" preview-theme="vuepress"/>
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

        <hr class="section-divider my-8"/>

        <!-- F3: 上下篇导航 -->
        <nav v-if="neighbors.prev || neighbors.next" class="grid gap-4 mb-8"
             :class="neighbors.prev && neighbors.next ? 'md:grid-cols-2' : 'grid-cols-1'">
          <router-link
              v-if="neighbors.prev"
              :to="`/article/${neighbors.prev.id}`"
              class="group flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              style="background: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)">
            <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                 style="background: var(--color-hover)">
              <LeftOutlined style="color: var(--color-primary)"/>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs mb-0.5" style="color: var(--color-text-secondary)">上一篇</div>
              <div class="font-medium truncate transition-colors group-hover:text-[var(--color-primary)]"
                   style="color: var(--color-text)">{{ neighbors.prev.title }}
              </div>
            </div>
          </router-link>
          <router-link
              v-if="neighbors.next"
              :to="`/article/${neighbors.next.id}`"
              class="group flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 text-right"
              style="background: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)">
            <div class="min-w-0 flex-1">
              <div class="text-xs mb-0.5" style="color: var(--color-text-secondary)">下一篇</div>
              <div class="font-medium truncate transition-colors group-hover:text-[var(--color-primary)]"
                   style="color: var(--color-text)">{{ neighbors.next.title }}
              </div>
            </div>
            <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                 style="background: var(--color-hover)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                   style="color: var(--color-primary)">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </router-link>
        </nav>

        <!-- F1: 相关文章推荐 -->
        <section v-if="relatedArticles.length" class="mb-8">
          <h3 class="text-lg font-bold mb-4 flex items-center gap-2" style="color: var(--color-text)">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                 style="color: var(--color-primary)">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            相关推荐
          </h3>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <router-link
                v-for="rel in relatedArticles"
                :key="rel.id"
                :to="`/article/${rel.id}`"
                class="group flex flex-col p-4 rounded-xl transition-all duration-300 hover:-translate-y-1"
                style="background: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)">
              <div class="font-medium mb-2 line-clamp-2 transition-colors group-hover:text-[var(--color-primary)]"
                   style="color: var(--color-text); min-height: 2.8em">{{ rel.title }}
              </div>
              <p v-if="rel.excerpt" class="text-xs mb-3 line-clamp-2" style="color: var(--color-text-secondary)">
                {{ rel.excerpt }}</p>
              <div class="mt-auto flex items-center gap-2 text-xs" style="color: var(--color-text-secondary)">
                <span v-if="rel.category" class="px-2 py-0.5 rounded"
                      style="background: var(--color-hover); color: var(--color-primary)">{{ rel.category }}</span>
                <span>{{ formatDate(rel.published_at) }}</span>
                <span class="opacity-30">·</span>
                <span>{{ rel.view_count }} 阅读</span>
              </div>
            </router-link>
          </div>
        </section>

        <CommentSection :articleId="articleId as string"/>
      </div>
      <!-- 右侧站点信息：文章页内嵌 Sidebar -->
      <Sidebar class="hidden md:block w-60 lg:w-64 shrink-0"/>
    </div>

    <!-- 分享弹窗 -->
    <Transition name="fade">
      <div v-if="showShareModal" class="fixed inset-0 z-50 flex items-center justify-center"
           @click.self="showShareModal = false">
        <div class="absolute inset-0 bg-black/40" @click="showShareModal = false"/>
        <div class="relative w-80 rounded-2xl p-6 shadow-2xl" style="background: var(--color-card);">
          <button
              class="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full cursor-pointer border-0 transition-colors"
              style="color: var(--color-text-secondary); background: transparent;" @click="showShareModal = false">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <h3 class="text-lg font-bold mb-4" style="color: var(--color-text)">分享文章</h3>
          <div class="grid grid-cols-5 gap-2 mb-4">
            <button
                class="flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer border-0 transition-all hover:scale-105"
                style="background: var(--color-hover);" @click="copyToClipboard(currentUrl); showShareModal = false">
              <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: #49b1f5;">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </div>
              <span class="text-xs" style="color: var(--color-text)">复制链接</span>
            </button>
            <button
                class="flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer border-0 transition-all hover:scale-105"
                style="background: var(--color-hover);" @click="shareToWeibo()">
              <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: #e6162d;">
                <span class="text-white font-bold text-sm">微</span>
              </div>
              <span class="text-xs" style="color: var(--color-text)">微博</span>
            </button>
            <button
                class="flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer border-0 transition-all hover:scale-105"
                style="background: var(--color-hover);" @click="shareToX()">
              <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: #000;">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span class="text-xs" style="color: var(--color-text)">X</span>
            </button>
            <button
                class="flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer border-0 transition-all hover:scale-105"
                style="background: var(--color-hover);" @click="shareToQQ()">
              <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: #12b7f5;">
                <span class="text-white font-bold text-sm">Q</span>
              </div>
              <span class="text-xs" style="color: var(--color-text)">QQ</span>
            </button>
            <button
                class="flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer border-0 transition-all hover:scale-105"
                style="background: var(--color-hover);" @click="shareToWechat()">
              <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: #07c160;">
                <span class="text-white font-bold text-sm">微</span>
              </div>
              <span class="text-xs" style="color: var(--color-text)">微信</span>
            </button>
          </div>
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg" style="background: var(--color-hover);">
            <span class="text-xs truncate flex-1" style="color: var(--color-text-secondary)">{{ currentUrl }}</span>
            <button class="text-xs px-2 py-1 rounded cursor-pointer border-0 shrink-0"
                    style="background: var(--color-primary); color: white;" @click="copyToClipboard(currentUrl)">复制
            </button>
          </div>
        </div>
      </div>
    </Transition>
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

/* F7: 移动端 TOC 抽屉动画 */
.toc-slide-enter-active,
.toc-slide-leave-active {
  transition: opacity 0.25s ease;
}

.toc-slide-enter-active > div:last-child,
.toc-slide-leave-active > div:last-child {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.toc-slide-enter-from,
.toc-slide-leave-to {
  opacity: 0;
}

.toc-slide-enter-from > div:last-child,
.toc-slide-leave-to > div:last-child {
  transform: translateX(-100%);
}

.toc-scroll {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  scrollbar-width: thin;
}

/* F7: 点击目录跳转后，标题不被固定导航栏遮挡 */
.article-content-markdown :deep(h1),
.article-content-markdown :deep(h2),
.article-content-markdown :deep(h3),
.article-content-markdown :deep(h4),
.article-content-markdown :deep(h5),
.article-content-markdown :deep(h6) {
  scroll-margin-top: 80px;
}

.toc-scroll :deep(.md-editor-catalog-item) {
  transition: color 0.2s ease,
  background-color 0.2s ease;
}

.toc-scroll :deep(.md-editor-catalog-active) {
  color: var(--color-primary);
  font-weight: 600;
}
</style>
