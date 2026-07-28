<script setup lang="ts">

import {useRoute} from "vue-router";
import {onMounted} from "vue";

export interface CommentItem {
  id: string
  article_id: string
  parent_id: string | null
  parent_author_name: string | null
  author_name: string
  author_email: string | null
  avatar: string | null
  content: string
  content_type: string
  is_ai_reply: boolean
  is_approved: boolean
  like_count: number
  created_at: string
  user: { id: number; username: string; avatar: string | null; role: string } | null
  replies: CommentItem[]
}

const props = defineProps<{
  comment: CommentItem
  depth: number
  renderContent: (item: CommentItem) => string
  formatTime: (d: string) => string
  getAvatar: (item: CommentItem) => string | null
  getInitial: (item: CommentItem) => string
  onLike: (id: string) => void
  articleId: string
  likedIds?: Set<string>
}>()

const emit = defineEmits<{
  reply: [item: CommentItem]
}>()

const route = useRoute()
const maxDepth = 12
// 二层回复之后不再缩进
const indent = props.depth <= 2 ? props.depth : 2

function onReply() {
  emit('reply', props.comment)
}

function onLikeClick() {
  props.onLike(props.comment.id)
}

const scrollToSection = () => {
  const comment = route.query.c
  const element = document.getElementById(comment as string)
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',  // 平滑滚动
      block: 'start'       // 滚动到顶部
    })
    // 设置class
    element.classList.add('section-highlight')
  }
  // 滚动完成后移除
  setTimeout(() => {
    element?.classList.remove('section-highlight')
  }, 5000)
}
onMounted(() => {
  scrollToSection()
})
</script>

<script lang="ts">
export default {
  name: 'CommentNode'
}
</script>

<template>
  <div>
    <div class="comment-item mb-3" :style="{ marginLeft: `${indent * 28}px` }">
      <div class="flex gap-3">
        <!-- 头像 -->
        <img
            v-if="getAvatar(comment)"
            :src="getAvatar(comment)!"
            class="w-9 h-9 rounded-full shrink-0 object-cover"
            style="border: 2px solid var(--color-border)"
            alt=""
        />
        <div
            v-else
            class="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
            style="background: var(--gradient-primary)"
        >
          {{ getInitial(comment) }}
        </div>

        <!-- 内容 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-semibold" style="color: var(--color-text)">
              {{ comment.author_name }}
            </span>
            <span
                v-if="comment.parent_author_name"
                class="text-xs"
                style="color: var(--color-text-secondary)"
            >
              回复
              <span style="color: var(--color-primary); font-weight: 500">{{ comment.parent_author_name }}</span>
            </span>
            <span
                v-if="comment.is_ai_reply"
                class="text-xs px-1.5 py-0.5 rounded font-medium"
                style="background: var(--gradient-primary); color: white"
            >AI</span>
            <span
                v-if="comment.user?.role === 'admin'"
                class="text-xs px-1.5 py-0.5 rounded font-medium"
                style="background: #ef4444; color: white"
            >管理员</span>
            <span class="text-xs" style="color: var(--color-text-secondary)">
              {{ formatTime(comment.created_at) }}
            </span>
          </div>

          <div
              :id="comment.id"
              class="comment-body mt-1.5 text-sm leading-relaxed"
              style="color: var(--color-text-secondary)"
              v-html="renderContent(comment)"
          ></div>

          <button
              @click="onReply"
              class="mt-1.5 text-xs cursor-pointer border-0 bg-transparent transition-opacity duration-200 hover:opacity-70"
              style="color: var(--color-primary)"
          >
            回复
          </button>
          <button
              @click="onLikeClick"
              class="ml-3 mt-1.5 text-xs cursor-pointer border-0 bg-transparent transition-all duration-200 hover:scale-110 inline-flex items-center gap-0.5"
              :style="likedIds?.has(comment.id) ? 'color: #ef4444' : 'color: var(--color-text-secondary)'"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" :fill="likedIds?.has(comment.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
              <path
                  d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            <span v-if="comment.like_count > 0" class="font-medium"
                  :style="likedIds?.has(comment.id) ? 'color: #ef4444' : 'color: var(--color-primary)'">{{ comment.like_count }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 递归子回复 -->
    <template v-if="comment.replies?.length > 0 && depth < maxDepth">
      <CommentNode
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          :depth="depth + 1"
          :renderContent="renderContent"
          :formatTime="formatTime"
          :getAvatar="getAvatar"
          :getInitial="getInitial"
          :onLike="onLike"
          :articleId="articleId"
          @reply="(item: CommentItem) => emit('reply', item)"
      />
    </template>
  </div>
</template>

<style scoped>
/* 内容区域高亮动画 */
.section-highlight {
  animation: highlightGreen 5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes highlightGreen {
  0% {
    background-color: rgba(76, 175, 80, 0);
  }
  10% {
    background-color: rgba(76, 175, 80, 0.55);
    box-shadow: 0 4px 20px rgba(76, 175, 80, 0.5);
  }
  35% {
    background-color: rgba(76, 175, 80, 0.35);
    box-shadow: 0 2px 12px rgba(76, 175, 80, 0.35);
  }
  100% {
    background-color: rgba(76, 175, 80, 0);
    box-shadow: 0 0 0 rgba(76, 175, 80, 0);
  }
}

/*===========*/
.comment-body {
  transition: all 0.3s ease;
  scroll-margin-top: 90px;
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
</style>