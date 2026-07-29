<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import api from '@/utils/api'
import {Marked} from 'marked'
import {sanitizeHtml, escapeHtml, textToSafeHtml} from '@/utils/sanitize'

import {LoadingOutlined, SendOutlined} from '@ant-design/icons-vue'
import CommentNode, {type CommentItem} from './CommentNode.vue'
import MdCommentEditor from './MdCommentEditor.vue'
import Message from "vue-m-message";
import {useArticleStore} from "@/stores/article.ts";
import {useThemeStore} from "@/stores/theme.ts";

const articleStore = useArticleStore()
const themeStore = useThemeStore()

const theme = computed(() => themeStore.theme)
const props = defineProps<{
  articleId: string
}>()


const marked = new Marked()
marked.setOptions({breaks: true, gfm: true})

const comments = ref<CommentItem[]>([])
const loading = ref(false)
const submitting = ref(false)
const cursor = ref<string | null>(null)
const hasMore = ref(false)
const error = ref<string | null>(null)
// 评论总数（含回复，由后端返回）
const total = ref(0)
// F5: 评论排序（latest 最新 / hot 最热按赞数，服务端排序）
const sortBy = ref<'latest' | 'hot'>('latest')
// F5: 已点赞的评论 id 集合（本地防抖，避免重复点击）
const likedIds = ref<Set<string>>(new Set())

const qqNumber = ref('')
const content = ref('')
const contentType = ref<'markdown' | 'text'>('markdown')
const replyTo = ref<CommentItem | null>(null)
// 验证码
const captchaKey = ref('')
const captchaCode = ref('')
const captchaSvg = ref('')
const captchaLoading = ref(false)

async function fetchComments(append = false) {
  loading.value = true
  error.value = null
  try {
    const params: any = {pageSize: 30, sort: sortBy.value}
    if (append && cursor.value) {
      params.cursor = cursor.value
    }

    const res = await api.get(`/articles/${props.articleId}/comments`, {params})
    const data = res.data
    const payload = data.data || data
    const list = payload.list || []

    if (append) {
      comments.value = [...comments.value, ...list]
    } else {
      comments.value = list
    }

    cursor.value = payload.cursor || null
    hasMore.value = payload.hasMore || false
    total.value = payload.total ?? total.value
  } catch (e: any) {
    error.value = e?.response?.data?.message || '加载评论失败'
  } finally {
    loading.value = false
  }
}

function renderMarkdown(text: string): string {
  try {
    return sanitizeHtml(marked.parse(text) as string)
  } catch {
    return escapeHtml(text)
  }
}

function renderContent(item: CommentItem): string {
  if (item.content_type === 'markdown') return renderMarkdown(item.content)
  return textToSafeHtml(item.content)
}

function startReply(comment: CommentItem) {
  replyTo.value = comment
  contentType.value = comment.content_type as 'markdown' | 'text'
  // 滚动到评论区表单
  setTimeout(() => {
    const el = document.querySelector('.comment-section')
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'start'})
    }
  }, 150)
}

function cancelReply() {
  replyTo.value = null
}

async function submitComment() {
  if (!content.value.trim()) {
    Message.warning('请输入评论内容')
    return
  }
  if (!qqNumber.value.trim() || !/^\d{5,12}$/.test(qqNumber.value.trim())) {
    Message.warning('请输入有效的QQ号')
    return
  }
  if (!captchaCode.value.trim()) {
    Message.warning('请输入验证码')
    return
  }

  submitting.value = true
  try {
    await api.post(`/articles/${props.articleId}/comments`, {
      content: content.value.trim(),
      qq_number: qqNumber.value.trim(),
      parent_id: replyTo.value?.id || undefined,
      content_type: contentType.value,
      captcha_key: captchaKey.value,
      captcha_code: captchaCode.value
    })

    content.value = ''
    replyTo.value = null
    captchaCode.value = ''
    cursor.value = null
    Message.success('评论发表成功')
    await fetchComments()
    await refreshCaptcha()
    await articleStore.fetchArticle(props.articleId)
  } catch (e: any) {
    Message.error(e?.response?.data?.message || '评论发表失败')
    await refreshCaptcha()
  } finally {
    submitting.value = false
  }
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`

  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours} 小时前`

  const days = Math.floor(diff / 86400000)
  if (days < 30) return `${days} 天前`

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  })
}

function toggleContentType() {
  contentType.value = contentType.value === 'markdown' ? 'text' : 'markdown'
}

function loadMore() {
  fetchComments(true)
}

async function refreshCaptcha() {
  captchaLoading.value = true
  try {
    const res = await api.get('/captcha')
    const data = res.data.data
    captchaKey.value = data.key
    captchaSvg.value = data.svg
    captchaCode.value = ''
  } catch (e: any) {
    Message.error('验证码加载失败')
  } finally {
    captchaLoading.value = false
  }
}

// F5: 切换排序时重置游标并从服务端重新拉取
watch(sortBy, () => {
  cursor.value = null
  fetchComments()
})

async function onLike(commentId: string) {
  if (likedIds.value.has(commentId)) {
    Message.info('你已经点过赞啦')
    return
  }
  try {
    const res = await api.post(`/articles/${props.articleId}/comments/${commentId}/like`)
    const data = res.data.data || res.data
    // 更新本地 like_count
    updateCommentLike(comments.value, commentId, data.like_count)
    likedIds.value.add(commentId)
    Message.success('点赞成功')
  } catch (e: any) {
    const errMsg = e?.response?.data?.message || '点赞失败'
    Message.error(errMsg)
  }
}

function updateCommentLike(list: CommentItem[], targetId: string, newCount: number) {
  for (const c of list) {
    if (c.id === targetId) {
      c.like_count = newCount
      return
    }
    if (c.replies?.length) {
      updateCommentLike(c.replies, targetId, newCount)
    }
  }
}

function getAvatar(item: CommentItem): string | null {
  if (item.avatar) return item.avatar
  if (item.user?.avatar) return item.user.avatar
  return null
}

function getInitial(item: CommentItem): string {
  return item.author_name.charAt(0).toUpperCase()
}

onMounted(() => {
  fetchComments();
  refreshCaptcha()
})

watch(() => props.articleId, () => {
  cursor.value = null
  comments.value = []
  fetchComments()
})
</script>

<template>
  <div class="comment-section mt-8">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h3 class="text-lg font-bold flex items-center gap-2" style="color: var(--color-text)">
        <svg class="w-5 h-5" style="color: var(--color-primary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        评论
        <span v-if="total > 0" class="text-sm font-medium px-2 py-0.5 rounded" style="background: var(--color-hover); color: var(--color-primary)">{{ total }}</span>
      </h3>
      <!-- F5: 排序切换 -->
      <div v-if="total > 0" class="flex items-center gap-1 text-xs p-1 rounded-lg" style="background: var(--color-hover)">
        <button
          @click="sortBy = 'latest'"
          class="px-3 py-1 rounded-md cursor-pointer border-0 transition-all"
          :style="sortBy === 'latest' ? 'background: var(--color-card); color: var(--color-primary); font-weight: 600; box-shadow: var(--shadow-sm)' : 'background: transparent; color: var(--color-text-secondary)'"
        >最新</button>
        <button
          @click="sortBy = 'hot'"
          class="px-3 py-1 rounded-md cursor-pointer border-0 transition-all"
          :style="sortBy === 'hot' ? 'background: var(--color-card); color: var(--color-primary); font-weight: 600; box-shadow: var(--shadow-sm)' : 'background: transparent; color: var(--color-text-secondary)'"
        >最热</button>
      </div>
    </div>

    <!-- 评论表单 -->
    <div class="comment-form p-5 rounded-xl mb-6"
         style="background: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)">
      <div v-if="replyTo" class="flex items-center gap-2 mb-3 text-sm p-2 rounded-lg"
           style="background: var(--color-hover); color: var(--color-text-secondary)">
        <span>回复</span>
        <span style="color: var(--color-primary); font-weight: 500">{{ replyTo.author_name }}</span>
        <button @click="cancelReply" class="ml-auto cursor-pointer hover:opacity-70 bg-transparent border-0"
                style="color: var(--color-text-secondary)">✕
        </button>
      </div>

      <div class="mb-3">
        <input
            v-model="qqNumber"
            type="text"
            placeholder="输入QQ号（用于接收回复通知）"
            maxlength="12"
            class="w-full sm:w-64 px-3.5 py-2.5 rounded-sm text-sm outline-none transition-all duration-200 focus:border-current"
            style="background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text)"
        >
      </div>

      <div class="relative">
        <MdCommentEditor
            v-model="content"
            :theme="theme"
            placeholder="支持Markdown 语法，尝试 **加粗**、*斜体*、`代码` 等'"
        />
      </div>

      <div class="gap-3 mt-3 flex-wrap">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-2">
            <div
                class="captcha-svg h-9 rounded-lg overflow-hidden cursor-pointer border flex items-center bg-white"
                style="border-color: var(--color-border)"
                @click="refreshCaptcha"
                v-html="captchaSvg"
                :title="'点击刷新验证码'"
            ></div>
            <input
                v-model="captchaCode"
                type="text"
                placeholder="验证码"
                maxlength="6"
                class="w-20 px-2.5 py-1.5 rounded-lg text-sm text-center outline-none transition-all duration-200 focus:border-current"
                style="background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text)"
            >
          </div>
          <button
              @click="submitComment"
              :disabled="submitting"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white cursor-pointer transition-all duration-200 border-0 disabled:opacity-60 disabled:cursor-not-allowed"
              style="background: var(--gradient-primary)"
          >
            <LoadingOutlined v-if="submitting" class="animate-spin text-xs"/>
            <SendOutlined v-else class="text-xs"/>
            {{ submitting ? '发表中...' : '发表评论' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading && comments.length === 0" class="flex items-center justify-center py-10">
      <LoadingOutlined class="animate-spin text-lg" style="color: var(--color-primary)"/>
    </div>

    <!-- 错误 -->
    <div v-else-if="error && comments.length === 0" class="text-center py-10">
      <p style="color: var(--color-text-secondary)">{{ error }}</p>
    </div>

    <!-- 空评论 -->
    <div v-else-if="comments.length === 0" class="text-center py-10">
      <p style="color: var(--color-text-secondary)">暂无评论，来发表第一条评论吧</p>
    </div>

    <!-- 评论列表 (递归渲染) -->
    <div v-else class="comments-list space-y-4">
      <template v-for="comment in comments" :key="comment.id">
        <CommentNode
            :comment="comment"
            :depth="0"
            :likedIds="likedIds"
            @reply="startReply"
            :renderContent="renderContent"
            :formatTime="formatTime"
            :getAvatar="getAvatar"
            :getInitial="getInitial"
            :onLike="onLike"
            :articleId="articleId"
        />
      </template>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="text-center mt-6">
      <button
          @click="loadMore"
          :disabled="loading"
          class="px-5 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200 border-0 bg-transparent hover:opacity-70 disabled:opacity-50"
          style="color: var(--color-primary)"
      >
        <LoadingOutlined v-if="loading" class="animate-spin text-xs mr-1"/>
        {{ loading ? '加载中...' : '加载更多评论' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.comment-section input:focus,
.comment-section textarea:focus {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.comment-body :deep(p) {
  margin: 0 0 0.5em 0;
}

.comment-body :deep(p:last-child) {
  margin-bottom: 0;
}

.comment-body :deep(code) {
  background-color: var(--color-hover);
  padding: 0.1em 0.35em;
  border-radius: 3px;
  font-size: 0.9em;
  color: var(--color-primary);
}

.comment-body :deep(pre) {
  margin: 0.5em 0;
  padding: 0.75em 1em;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow-x: auto;
}

.comment-body :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--color-text-secondary);
}

.comment-body :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.comment-body :deep(blockquote) {
  margin: 0.5em 0;
  padding: 0.5em 0.75em;
  border-left: 3px solid var(--color-primary);
  background-color: var(--color-hover);
  border-radius: 0 4px 4px 0;
  color: var(--color-text-secondary);
}

.comment-body :deep(ul),
.comment-body :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.comment-body :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}

.comment-body :deep(h1),
.comment-body :deep(h2),
.comment-body :deep(h3),
.comment-body :deep(h4) {
  margin: 0.5em 0 0.3em 0;
  font-size: 1.1em;
  font-weight: 600;
  color: var(--color-text);
}

.markdown-preview {
  max-height: 200px;
  overflow-y: auto;
}

.captcha-svg {
  min-width: 90px;
}

.captcha-svg :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>