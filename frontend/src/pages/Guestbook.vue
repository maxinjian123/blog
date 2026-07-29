<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import api from '@/utils/api'
import {Marked} from 'marked'
import {sanitizeHtml} from '@/utils/sanitize'
import CommentNode, {type CommentItem} from '@/components/article/CommentNode.vue'
import Message from 'vue-m-message'
import { SendOutlined } from '@ant-design/icons-vue'

const marked = new Marked()
marked.setOptions({breaks: true, gfm: true})

const comments = ref<CommentItem[]>([])
const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const hasMore = computed(() => comments.value.length < total.value)

const authorName = ref('')
const authorEmail = ref('')
const content = ref('')
const replyTo = ref<CommentItem | null>(null)
const likedIds = ref<Set<string>>(new Set())

function renderContent(item: CommentItem): string {
  try {
    return sanitizeHtml(marked.parse(item.content) as string)
  } catch {
    return sanitizeHtml(item.content)
  }
}

function formatTime(d: string): string {
  const date = new Date(d)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function getAvatar(item: CommentItem): string | null {
  if (item.avatar) return item.avatar
  if (item.user?.avatar) return item.user.avatar
  return null
}

function getInitial(item: CommentItem): string {
  return (item.author_name || item.user?.username || 'U').charAt(0).toUpperCase()
}

async function fetchComments(append = false) {
  loading.value = true
  try {
    const res = await api.get('/guestbook', {
      params: {page: append ? page.value : 1, pageSize}
    })
    const payload = res.data?.data || res.data
    if (append) {
      comments.value.push(...(payload.list || []))
    } else {
      comments.value = payload.list || []
      page.value = 1
    }
    total.value = payload.total || 0
  } catch (e: any) {
    Message.error(e?.response?.data?.message || '加载留言失败')
  } finally {
    loading.value = false
  }
}

function loadMore() {
  page.value++
  fetchComments(true)
}

async function submitComment() {
  if (!authorName.value.trim()) {
    Message.error('请输入昵称')
    return
  }
  if (!content.value.trim()) {
    Message.error('请输入留言内容')
    return
  }
  submitting.value = true
  try {
    await api.post('/guestbook', {
      author_name: authorName.value.trim(),
      author_email: authorEmail.value.trim() || null,
      content: content.value.trim(),
      parent_id: replyTo.value?.id || null
    })
    Message.success(replyTo.value ? '回复成功' : '留言成功')
    content.value = ''
    replyTo.value = null
    await fetchComments()
  } catch (e: any) {
    Message.error(e?.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function onReply(item: CommentItem) {
  replyTo.value = item
  document.getElementById('guestbook-form')?.scrollIntoView({behavior: 'smooth', block: 'center'})
}

async function onLike(id: string) {
  if (likedIds.value.has(id)) return
  try {
    await api.post(`/guestbook/${id}/like`)
    likedIds.value.add(id)
    const findAndInc = (list: CommentItem[]) => {
      for (const c of list) {
        if (c.id === id) {
          c.like_count++
          return true
        }
        if (c.replies?.length && findAndInc(c.replies)) return true
      }
      return false
    }
    findAndInc(comments.value)
  } catch {
    Message.error('点赞失败')
  }
}

onMounted(fetchComments)
</script>

<template>
  <div class="guestbook-page">
    <div class="flex items-center gap-3 mb-8 pt-2">
      <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)"/>
      <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">留言板</h1>
    </div>

    <div class="rounded-xl p-6 md:p-8 mb-8 animate-fade-in"
         style="background-color: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)">
      <p class="text-sm mb-6" style="color: var(--color-text-secondary)">
        欢迎留下你的想法、建议或任何问题。友善交流，共同进步。
      </p>

      <div id="guestbook-form" class="space-y-4">
        <div class="flex gap-4 flex-col md:flex-row">
          <input
              v-model="authorName"
              type="text"
              placeholder="昵称 *"
              class="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style="background-color: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text)"
          />
          <input
              v-model="authorEmail"
              type="email"
              placeholder="邮箱（选填）"
              class="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style="background-color: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text)"
          />
        </div>

        <div v-if="replyTo" class="flex items-center justify-between text-xs px-3 py-2 rounded-lg"
             style="background-color: var(--color-primary-light); color: var(--color-primary)">
          <span>正在回复 <strong>{{ replyTo.author_name }}</strong></span>
          <button class="underline bg-transparent border-0 cursor-pointer" @click="replyTo = null">取消</button>
        </div>

        <textarea
            v-model="content"
            rows="4"
            placeholder="写下你的留言..."
            class="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none transition-colors"
            style="background-color: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text)"
        />

        <button
            @click="submitComment"
            :disabled="submitting"
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-60 cursor-pointer border-0"
            style="background: var(--gradient-primary)"
        >
          <SendOutlined/>
          {{ submitting ? '提交中...' : (replyTo ? '回复' : '留言') }}
        </button>
      </div>
    </div>

    <div v-if="loading && !comments.length" class="flex justify-center py-20">
      <div class="w-10 h-10 border-2 rounded-full animate-spin"
           style="border-color: var(--color-primary); border-top-color: transparent"/>
    </div>

    <div v-else-if="!comments.length" class="text-center py-16 rounded-xl"
         style="background-color: var(--color-card); border: 1px solid var(--color-border)">
      <p style="color: var(--color-text-secondary)">还没有留言，来做第一个留言的人吧</p>
    </div>

    <div v-else class="rounded-xl p-5 md:p-6 animate-fade-in"
         style="background-color: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)">
      <h2 class="text-sm font-semibold mb-5" style="color: var(--color-text-secondary)">
        全部留言 <span style="color: var(--color-primary)">{{ total }}</span> 条
      </h2>

      <CommentNode
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :depth="0"
          :renderContent="renderContent"
          :formatTime="formatTime"
          :getAvatar="getAvatar"
          :getInitial="getInitial"
          :onLike="onLike"
          :likedIds="likedIds"
          @reply="onReply"
      />

      <div v-if="hasMore" class="text-center mt-6">
        <button
            @click="loadMore"
            :disabled="loading"
            class="px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border"
            style="border-color: var(--color-border); color: var(--color-text-secondary); background: transparent"
        >
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>
  </div>
</template>
