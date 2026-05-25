<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import api from '@/utils/api'
import { marked } from 'marked'
import { nextTick, ref, watch } from 'vue'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const themeStore = useThemeStore()

const isOpen = ref(false)
const question = ref('')
const messages = ref<ChatMessage[]>([])
const isLoading = ref(false)
const isSummarizing = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// 当前正在流式渲染的 AI 回答
const streamingContent = ref('')
let abortController: AbortController | null = null

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true
})

function renderMarkdown(content: string): string {
  try {
    return marked.parse(content) as string
  } catch {
    return content
  }
}

watch(isOpen, async val => {
  if (val) {
    await nextTick()
    inputRef.value?.focus()
  }
})

function togglePanel() {
  isOpen.value = !isOpen.value
  // 关闭时取消请求
  if (!isOpen.value && abortController) {
    abortController.abort()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 流式接收 AI 回复
async function sendMessageStream() {
  const text = question.value.trim()
  if (!text || isLoading.value) return

  messages.value.push({ role: 'user', content: text })
  question.value = ''
  isLoading.value = true
  streamingContent.value = ''
  scrollToBottom()

  // 添加一个占位的 assistant 消息（内容为空）
  const assistantMsgIndex = messages.value.length
  messages.value.push({ role: 'assistant', content: '' })

  try {
    abortController = new AbortController()

    const token = localStorage.getItem('token') || ''
    const res = await fetch('/api/v1/ai/qa/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ question: text }),
      signal: abortController.signal
    })

    if (!res.ok) {
      throw new Error(`请求失败: ${res.status}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('无法读取响应流')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue

        const jsonStr = trimmedLine.slice(6)
        if (jsonStr === '[DONE]') continue

        try {
          const payload = JSON.parse(jsonStr)
          if (payload.chunk) {
            streamingContent.value += payload.chunk
            // 实时更新占位消息的内容
            messages.value[assistantMsgIndex].content = streamingContent.value
            scrollToBottom()
          }
        } catch {
          // 忽略 JSON 解析错误
        }
      }
    }
  } catch (e: any) {
    if (e.name === 'AbortError') {
      // 用户主动关闭，忽略
      return
    }
    // 流式失败时回退到普通请求
    try {
      const res = await api.post('/ai/qa', { question: text })
      const payload = res.data
      const data = payload.data || payload
      const answer = data.answer || data.content || '抱歉，我无法回答这个问题。'
      streamingContent.value = answer
      messages.value[assistantMsgIndex].content = answer
    } catch (fallbackErr: any) {
      const errMsg = fallbackErr?.response?.data?.message || fallbackErr?.message || 'AI 服务暂时不可用'
      messages.value[assistantMsgIndex].content = `**错误**: ${errMsg}`
    }
  } finally {
    isLoading.value = false
    abortController = null
    scrollToBottom()
  }
}

async function requestSummary() {
  if (isSummarizing.value) return
  isSummarizing.value = true

  messages.value.push({
    role: 'user',
    content: '请为我生成一份AI阅读总结。'
  })
  scrollToBottom()

  try {
    const res = await api.post('/ai/summary', { content: '' })
    const payload = res.data
    const data = payload.data || payload
    const summary = data.summary || data.content || '暂无新的阅读总结。'
    messages.value.push({
      role: 'assistant',
      content: summary
    })
  } catch (e: any) {
    const errMsg = e?.response?.data?.message || e?.message || '摘要生成服务暂时不可用，请稍后再试。'
    messages.value.push({
      role: 'assistant',
      content: `**错误**: ${errMsg}`
    })
  } finally {
    isSummarizing.value = false
    scrollToBottom()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessageStream()
  }
}
</script>

<template>
  <div class="ai-chat-widget" style="position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999">
    <button
      v-if="!isOpen"
      @click="togglePanel"
      class="w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer border-0 transition-all duration-300 hover:scale-110 hover:-translate-y-1 active:scale-95"
      :style="{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-lg)' }"
      title="AI 博客助手"
      aria-label="打开AI博客助手"
    >
      <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>

    <Transition name="panel">
      <div
        v-if="isOpen"
        class="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] rounded-2xl flex flex-col overflow-hidden"
        :style="{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', zIndex: 1000 }">
        <div class="flex items-center justify-between px-4 py-3.5 border-b shrink-0" style="border-color: var(--color-border)">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--gradient-primary)">
              <svg class="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold" style="color: var(--color-text)">AI 博客助手</h3>
              <p class="text-xs" style="color: var(--color-text-secondary)">基于 RAG 知识库的智能问答</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              @click="requestSummary"
              :disabled="isSummarizing"
              class="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border-0 cursor-pointer transition-all duration-200 hover:shadow-sm disabled:opacity-50 font-medium"
              style="background-color: var(--color-primary-light); color: var(--color-primary)"
              title="AI阅读总结">
              <svg v-if="!isSummarizing" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              <span v-if="isSummarizing" class="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>{{ isSummarizing ? '生成中' : '摘要' }}</span>
            </button>
            <button @click="togglePanel" class="w-8 h-8 flex items-center justify-center rounded-lg border-0 bg-transparent cursor-pointer transition-all duration-200 hover:bg-hover" style="color: var(--color-text-secondary)" title="关闭">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <div v-if="messages.length === 0" class="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-1" style="background: var(--color-hover)">
              <svg class="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-primary)">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <p class="text-sm font-medium" style="color: var(--color-text)">问我任何关于博客的问题</p>
            <p class="text-xs" style="color: var(--color-text-secondary)">也可以点击「摘要」获取每日阅读总结</p>
          </div>
          <div v-for="(msg, idx) in messages" :key="idx" class="flex gap-2" :class="msg.role === 'user' ? 'flex-row-reverse' : ''">
            <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" :style="msg.role === 'user' ? 'background: var(--gradient-primary); color: #fff' : 'background-color: var(--color-hover); color: var(--color-primary)'">
              {{ msg.role === 'user' ? 'U' : 'AI' }}
            </div>
            <div
              class="max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed markdown-body"
              :style="{
                backgroundColor: msg.role === 'user' ? 'var(--color-primary-light)' : 'var(--color-hover)',
                color: 'var(--color-text)',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px'
              }">
              <!-- 用户消息直接显示文本 -->
              <template v-if="msg.role === 'user'">{{ msg.content }}</template>
              <!-- AI 消息使用 Markdown 渲染 -->
              <div v-else v-html="renderMarkdown(msg.content)"></div>
            </div>
          </div>
          <div v-if="isLoading" class="flex gap-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style="background-color: var(--color-hover); color: var(--color-primary)">AI</div>
            <div class="px-4 py-3 rounded-2xl flex gap-1.5" style="background-color: var(--color-hover); border-radius: 4px 16px 16px 16px">
              <span class="w-2 h-2 rounded-full animate-bounce" style="background-color: var(--color-primary); animation-delay: 0ms" />
              <span class="w-2 h-2 rounded-full animate-bounce" style="background-color: var(--color-primary); animation-delay: 150ms" />
              <span class="w-2 h-2 rounded-full animate-bounce" style="background-color: var(--color-primary); animation-delay: 300ms" />
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 px-4 py-3 border-t shrink-0" style="border-color: var(--color-border)">
          <input
            ref="inputRef"
            v-model="question"
            type="text"
            class="flex-1 px-4 py-2.5 text-sm rounded-xl outline-none transition-all duration-200"
            placeholder="输入你的问题..."
            @keydown="handleKeydown"
            :disabled="isLoading"
            style="background-color: var(--color-bg); color: var(--color-text); border: 1px solid var(--color-border)" />
          <button
            @click="sendMessageStream"
            :disabled="isLoading || !question.trim()"
            class="w-10 h-10 flex items-center justify-center rounded-xl border-0 cursor-pointer transition-all duration-200 text-white disabled:opacity-30 hover:shadow-md active:scale-95"
            style="background: var(--gradient-primary)">
            <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.panel-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.panel-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.panel-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}

/* Markdown 渲染样式 */
.markdown-body :deep(h1) {
  font-size: 1.4em;
  font-weight: 700;
  margin: 0.6em 0 0.3em;
}
.markdown-body :deep(h2) {
  font-size: 1.2em;
  font-weight: 700;
  margin: 0.5em 0 0.25em;
}
.markdown-body :deep(h3) {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0.4em 0 0.2em;
}
.markdown-body :deep(p) {
  margin: 0.3em 0;
}
.markdown-body :deep(code) {
  background: var(--color-bg);
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'Fira Code', 'Cascadia Code', monospace;
}
.markdown-body :deep(pre) {
  background: var(--color-bg);
  padding: 0.6em 0.8em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.4em 0;
}
.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
}
.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--color-primary);
  padding-left: 0.8em;
  margin: 0.3em 0;
  color: var(--color-text-secondary);
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5em;
  margin: 0.3em 0;
}
.markdown-body :deep(li) {
  margin: 0.15em 0;
}
.markdown-body :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.4em 0;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--color-border);
  padding: 0.3em 0.6em;
  text-align: left;
}
.markdown-body :deep(th) {
  background: var(--color-bg);
  font-weight: 600;
}
.markdown-body :deep(strong) {
  font-weight: 700;
}
</style>
