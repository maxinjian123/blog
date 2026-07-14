<script setup lang="ts">
import { marked } from 'marked'
import { formatDate } from '@/utils/format'
import type { Comment } from '@/types/models'

interface Props {
  comment: Comment
  depth?: number
  highlightCommentId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
  highlightCommentId: null,
})

const emit = defineEmits<{
  reply: [comment: Comment]
  like: [commentId: string]
}>()

const maxDepth = 12

function onReply() {
  emit('reply', props.comment)
}

function onLike() {
  emit('like', props.comment.id)
}

function renderCommentContent(content: string, contentType: string) {
  if (contentType === 'markdown') {
    try {
      return marked.parse(content, { async: false }) as string
    } catch {
      return content.replace(/\n/g, '<br>')
    }
  }
  return content.replace(/\n/g, '<br>')
}
</script>

<template>
  <div
    :id="`comment-${comment.id}`"
    class="comment-item"
    :class="{
      'is-highlighted': highlightCommentId === comment.id,
      'is-nested': depth > 0
    }"
    :style="{ marginLeft: depth > 0 ? '24px' : '0' }"
  >
    <div class="comment-header">
      <img v-if="comment.avatar" class="comment-avatar" :src="comment.avatar" alt="" />
      <div v-else class="comment-avatar">{{ comment.author_name[0] }}</div>
      <div class="comment-info">
        <div class="comment-author">
          {{ comment.author_name }}
          <span v-if="comment.parent_author_name" class="reply-to">
            回复 {{ comment.parent_author_name }}
          </span>
          <lay-tag v-if="comment.is_ai_reply" size="xs" color="green">AI</lay-tag>
          <lay-tag v-if="comment.user?.role === 'admin'" size="xs" color="red">管理员</lay-tag>
        </div>
        <div class="comment-time">{{ formatDate(comment.created_at, true) }}</div>
      </div>
    </div>
    <div
      v-if="comment.content_type === 'markdown'"
      class="comment-content md-content"
      v-html="renderCommentContent(comment.content, comment.content_type)"
    />
    <div
      v-else
      class="comment-content"
      v-html="renderCommentContent(comment.content, comment.content_type)"
    />
    <div class="comment-actions">
      <lay-button size="xs" @click="onReply">回复</lay-button>
      <lay-button size="xs" @click="onLike">
        <lay-icon type="layui-icon-praise" />
        {{ comment.like_count || 0 }}
      </lay-button>
    </div>

    <!-- 递归渲染子回复，depth >= 1 后不再继续缩进，统一平级展示 -->
    <div
      v-if="comment.replies?.length && depth < maxDepth"
      class="comment-replies"
      :class="{ 'is-flat': depth >= 1 }"
    >
      <CommentNode
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :depth="depth + 1"
        :highlight-comment-id="highlightCommentId"
        @reply="(c: Comment) => emit('reply', c)"
        @like="(id: string) => emit('like', id)"
      />
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.comment-item.is-nested {
  margin-top: 12px;
  background: #fff;
}

.comment-item.is-highlighted {
  animation: comment-flash 3s ease;
}

@keyframes comment-flash {
  0%, 100% {
    background-color: inherit;
    box-shadow: none;
  }
  10%, 50% {
    background-color: #fff8e1;
    box-shadow: 0 0 0 2px #ffd54f;
  }
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: #16baaa;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.comment-info {
  flex: 1;
}

.comment-author {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.reply-to {
  font-weight: normal;
  color: #999;
  font-size: 12px;
}

.comment-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.comment-content {
  color: #555;
  line-height: 1.6;
  font-size: 14px;
}

.comment-content.md-content :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}

.comment-content.md-content :deep(pre) {
  padding: 12px;
  overflow: auto;
  background: #f6f8fa;
  border-radius: 4px;
}

.comment-content.md-content :deep(code) {
  font-family: monospace;
  padding: 2px 6px;
  background: #f6f8fa;
  border-radius: 3px;
}

.comment-content.md-content :deep(blockquote) {
  margin: 8px 0;
  padding: 8px 12px;
  border-left: 3px solid #16baaa;
  background: #f5f5f5;
  border-radius: 0 4px 4px 0;
}

.comment-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.comment-replies {
  margin-top: 12px;
  padding-left: 0;
  border-left: 2px solid #eee;
}

.comment-replies.is-flat {
  border-left: none;
}
</style>
