<script setup lang="ts">
import {ref, computed, watch, onMounted, onUnmounted, nextTick} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {MdCatalog, MdPreview} from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import {useArticleStore} from '@/stores/article'
import {fetchCaptcha} from '@/services/api/captcha'
import {formatDate} from '@/utils/format'
import MdCommentEditor from '@/components/MdCommentEditor.vue'
import AiSummary from '@/components/AiSummary.vue'
import CommentNode from '@/components/CommentNode.vue'
import type {Comment} from '@/types/models'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()

const articleId = computed(() => route.params.id as string)
const likeLoading = ref(false)
const showBackTop = ref(false)
const highlightCommentId = ref<string | null>(null)
let highlightTimer: number | null = null

const currentArticle = computed(() => articleStore.currentArticle)
const scrollElement = document.documentElement

const showToc = computed(() => {
  const article = articleStore.currentArticle
  return article && article.content_type === 'markdown' && article.catalog && article.catalog.length > 0
})

// 评论表单
const commentForm = ref({
  content: '',
  qq_number: '',
  parent_id: '',
  captcha_key: '',
  captcha_code: '',
})
const replyingTo = ref<null | { id: string; name: string }>(null)
const captchaSvg = ref('')
const submitting = ref(false)

async function loadCaptcha() {
  const res = await fetchCaptcha()
  commentForm.value.captcha_key = res.key
  captchaSvg.value = res.svg
}

async function loadArticle() {
  articleStore.resetComments()
  await articleStore.fetchArticle(articleId.value)
  await articleStore.fetchComments(articleId.value)
  await loadCaptcha()
  highlightCommentFromUrl()
}

async function handleLike() {
  if (likeLoading.value) return
  likeLoading.value = true
  try {
    await articleStore.submitLikeArticle(articleId.value)
  } finally {
    likeLoading.value = false
  }
}

function replyTo(comment: { id: string; author_name: string } | Comment) {
  replyingTo.value = {id: comment.id, name: comment.author_name}
  commentForm.value.parent_id = comment.id
  scrollToComments()
}

function cancelReply() {
  replyingTo.value = null
  commentForm.value.parent_id = ''
}

async function submitComment() {
  if (!commentForm.value.content.trim()) {
    return
  }
  if (!/^\d{5,12}$/.test(commentForm.value.qq_number)) {
    return
  }
  submitting.value = true
  try {
    await articleStore.submitComment(articleId.value, {
      content: commentForm.value.content,
      qq_number: commentForm.value.qq_number,
      parent_id: commentForm.value.parent_id || undefined,
      content_type: 'markdown',
      captcha_key: commentForm.value.captcha_key,
      captcha_code: commentForm.value.captcha_code,
    })
    commentForm.value.content = ''
    commentForm.value.captcha_code = ''
    replyingTo.value = null
    commentForm.value.parent_id = ''
    await loadCaptcha()
  } finally {
    submitting.value = false
  }
}

async function loadMoreComments() {
  await articleStore.fetchComments(articleId.value, true)
}

async function handleLikeComment(commentId: string) {
  try {
    await articleStore.submitLikeComment(articleId.value, commentId)
  } catch {
    // 错误已由拦截器提示
  }
}

function scrollToComments() {
  const el = document.querySelector('.comment-section')
  el?.scrollIntoView({behavior: 'smooth', block: 'start'})
}

function scrollToCommentElement(id: string) {
  const el = document.getElementById(`comment-${id}`)
  if (!el) return false
  const headerOffset = 120
  const rect = el.getBoundingClientRect()
  const top = window.scrollY + rect.top - headerOffset
  window.scrollTo({top, behavior: 'smooth'})
  return true
}

function highlightCommentFromUrl() {
  if (highlightTimer) {
    window.clearTimeout(highlightTimer)
    highlightTimer = null
  }
  const commentId = route.query.c as string | undefined
  if (!commentId) {
    highlightCommentId.value = null
    return
  }
  nextTick(() => {
    if (scrollToCommentElement(commentId)) {
      highlightCommentId.value = commentId
      highlightTimer = window.setTimeout(() => {
        highlightCommentId.value = null
        highlightTimer = null
      }, 3000)
    } else {
      highlightCommentId.value = null
    }
  })
}

function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'})
}

function handleScroll() {
  showBackTop.value = window.scrollY > 300
}

function goBack() {
  router.back()
}

watch(articleId, loadArticle, {immediate: true})
watch(() => route.query.c, highlightCommentFromUrl)

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  if (!articleStore.currentArticle || articleStore.currentArticle.id !== articleId.value) {
    loadArticle()
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="article-page">
    <!-- 左侧固定操作栏 -->
    <div class="article-float-actions">
      <button
          class="action-btn"
          title="评论"
          @click="scrollToComments"
      >
        <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span v-if="articleStore.currentArticle?.comment_count" class="action-badge">
          {{ articleStore.currentArticle.comment_count }}
        </span>
      </button>
      <button
          :disabled="likeLoading"
          class="action-btn"
          title="点赞文章"
          @click="handleLike"
      >
        <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
              d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
        </svg>
        <span v-if="articleStore.currentArticle?.like_count" class="action-badge">
          {{ articleStore.currentArticle.like_count }}
        </span>
      </button>
    </div>

    <!-- 回到顶部 -->
    <Transition name="fade">
      <button
          v-if="showBackTop"
          class="back-top-btn"
          title="回到顶部"
          @click="scrollToTop"
      >
        <svg class="icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>
    </Transition>

    <!-- 加载中 -->
    <div v-if="articleStore.loading && !articleStore.currentArticle" class="loading-wrap">
      <lay-loading :loading="true" tip="加载文章中..."/>
    </div>

    <!-- 错误/不存在 -->
    <lay-empty v-else-if="!currentArticle" description="文章不存在"/>

    <!-- 文章内容 -->
    <div v-else-if="currentArticle" class="article-layout">
      <!-- 左侧目录 -->
      <aside v-if="showToc" class="article-toc">
        <div class="toc-sticky">
          <h4 class="toc-title">
            <lay-icon type="layui-icon-menu-fill"/>
            文章目录
          </h4>
          <MdCatalog
            :offset-top="120"
            :scroll-element-offset-top="120"
            :scroll-element="scrollElement"
            editor-id="article-preview"
          />
        </div>
      </aside>

      <!-- 右侧内容 -->
      <div class="article-main">
        <button class="back-btn" @click="goBack">
          <lay-icon type="layui-icon-left"/>
          返回
        </button>

        <header class="article-header">
          <lay-tag
              v-if="currentArticle.category"
              size="sm"
              color="blue"
              class="category-tag"
              @click="router.push(`/category/${currentArticle.category.id}/${currentArticle.category.slug}`)"
          >
            {{ currentArticle.category.name }}
          </lay-tag>
          <h1 class="article-title">{{ currentArticle.title }}</h1>
          <div class="article-meta">
            <span class="meta-item">
              <lay-icon type="layui-icon-username"/>
              {{ currentArticle.author?.username || '管理员' }}
            </span>
            <span class="meta-divider">|</span>
            <span class="meta-item">
              <lay-icon type="layui-icon-date"/>
              {{ formatDate(currentArticle.published_at || currentArticle.created_at) }}
            </span>
            <span class="meta-divider">|</span>
            <span class="meta-item">
              <lay-icon type="layui-icon-read"/>
              {{ currentArticle.view_count || 0 }} 阅读
            </span>
          </div>
        </header>

        <div v-if="currentArticle.cover" class="article-cover">
          <img :src="currentArticle.cover" :alt="currentArticle.title"/>
        </div>

        <AiSummary :summary="currentArticle.summary"/>

        <article v-if="currentArticle.content_type === 'markdown'" class="article-body">
          <MdPreview
              id="article-preview"
              v-model="currentArticle.content"
              language="zh-CN"
              preview-theme="cyanosis"
              :show-code-row-number="false"
          />
        </article>
        <article v-else class="article-body article-content" v-html="currentArticle.content"/>

        <footer class="article-footer">
          <div v-if="currentArticle.tags?.length" class="article-tags">
            <span class="tags-label">标签：</span>
            <span
                v-for="tag in currentArticle.tags"
                :key="tag.id"
                class="tag-item"
                @click="router.push(`/tag/${tag.id}/${tag.slug}`)"
            >
              #{{ tag.name }}
            </span>
          </div>
        </footer>

        <hr class="section-divider"/>

        <!-- 评论区域 -->
        <section class="comment-section">
          <h3 class="comment-section-title">
            <lay-icon type="layui-icon-dialogue"/>
            评论
          </h3>

          <div class="comment-form-card">
            <div v-if="replyingTo" class="reply-bar">
              <span>回复</span>
              <span class="reply-name">{{ replyingTo.name }}</span>
              <button class="reply-cancel" @click="cancelReply">✕</button>
            </div>

            <div class="qq-row">
              <lay-input
                  v-model="commentForm.qq_number"
                  placeholder="输入 QQ 号（用于接收回复通知）"
                  :maxlength="12"
              />
            </div>

            <MdCommentEditor
                height="300px"
                v-model="commentForm.content"
                placeholder="支持 Markdown 语法，尝试 **加粗**、*斜体*、`代码` 等"
            />

            <div class="comment-form-footer">
              <div class="captcha-row">
                <div class="captcha-svg" v-html="captchaSvg" @click="loadCaptcha"/>
                <lay-input
                    v-model="commentForm.captcha_code"
                    placeholder="验证码"
                    :maxlength="6"
                />
              </div>
              <lay-button type="primary" :loading="submitting" @click="submitComment">
                发表评论
              </lay-button>
            </div>
          </div>

          <lay-loading :loading="articleStore.loading" tip="加载中...">
            <div v-if="articleStore.comments.length" class="comment-list">
              <CommentNode
                v-for="comment in articleStore.comments"
                :key="comment.id"
                :comment="comment"
                :highlight-comment-id="highlightCommentId"
                @reply="replyTo"
                @like="handleLikeComment"
              />
              <div v-if="articleStore.hasMoreComments" class="load-more">
                <lay-button @click="loadMoreComments">加载更多评论</lay-button>
              </div>
            </div>
            <lay-empty v-else description="暂无评论，快来抢沙发吧"/>
          </lay-loading>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.article-page {
  position: relative;
}

/* 左侧浮动操作栏 */
.article-float-actions {
  position: fixed;
  left: 32px;
  bottom: 50%;
  transform: translateY(50%);
  z-index: 40;
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

@media (min-width: 1280px) {
  .article-float-actions {
    display: flex;
  }
}

.action-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  background: #fff;
  color: #16baaa;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn .icon {
  width: 20px;
  height: 20px;
}

.action-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: #fff;
  background: #16baaa;
  border-radius: 9px;
}

/* 回到顶部 */
.back-top-btn {
  position: fixed;
  right: 24px;
  bottom: 96px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  background: #16baaa;
  color: #fff;
  box-shadow: 0 4px 16px rgba(22, 186, 170, 0.35);
  z-index: 50;
  transition: all 0.3s ease;
}

.back-top-btn:hover {
  transform: scale(1.1);
}

.back-top-btn .icon {
  width: 20px;
  height: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 加载 */
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

/* 文章布局 */
.article-layout {
  display: flex;
  gap: 24px;
}

/* 左侧目录 */
.article-toc {
  display: none;
  flex-shrink: 0;
  width: 180px;
  position: relative;
}

@media (min-width: 992px) {
  .article-toc {
    display: block;
  }
}

.toc-sticky {
  position: fixed;
  top: 120px;
  width: 180px;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
}

.toc-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.toc-title :deep(.layui-icon) {
  color: #16baaa;
}

/* 主内容区 */
.article-main {
  flex: 1;
  min-width: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #666;
  background: transparent;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  color: #16baaa;
  border-color: #16baaa;
}

/* 文章头部 */
.article-header {
  margin-bottom: 24px;
}

.category-tag {
  cursor: pointer;
  margin-bottom: 12px;
}

.article-title {
  margin: 0 0 16px;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.3;
  color: #333;
}

@media (min-width: 768px) {
  .article-title {
    font-size: 30px;
  }
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #999;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-divider {
  opacity: 0.3;
  user-select: none;
}

/* 封面图 */
.article-cover {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.article-cover img {
  width: 100%;
  display: block;
}

/* 文章正文 */
.article-body {
  margin-bottom: 24px;
}

/* 防止点击目录后标题被 sticky header 盖住 */
.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3),
.article-body :deep(h4),
.article-body :deep(h5),
.article-body :deep(h6) {
  scroll-margin-top: 120px;
}

/* 页脚标签 */
.article-footer {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tags-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.tag-item {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f0f9f8;
  color: #16baaa;
}

.tag-item:hover {
  transform: translateY(-2px);
}

.section-divider {
  margin: 24px 0;
  border: none;
  border-top: 1px solid #eee;
}

/* 评论区域 */
.comment-section {
  margin-top: 24px;
}

.comment-section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.comment-section-title :deep(.layui-icon) {
  color: #16baaa;
}

.comment-form-card {
  padding: 16px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.reply-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 4px;
  background: #f5f5f5;
  color: #666;
}

.reply-name {
  color: #16baaa;
  font-weight: 500;
}

.reply-cancel {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
}

.qq-row {
  margin-bottom: 12px;
}

.comment-form-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.captcha-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.captcha-svg {
  cursor: pointer;
  height: 38px;
  min-width: 100px;
}

.captcha-svg :deep(svg) {
  height: 100%;
  width: 100%;
}

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
