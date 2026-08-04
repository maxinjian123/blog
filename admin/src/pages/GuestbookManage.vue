<script setup lang="ts">
import {h, onMounted, reactive, ref} from 'vue'
import api from '@/utils/api'
import {message, Modal} from 'ant-design-vue'
import {Marked} from 'marked'
import {escapeHtml, sanitizeHtml, textToSafeHtml} from '@/utils/sanitize'
import {MdEditor} from '@/components/editor'
import {
  CheckOutlined,
  CommentOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  SearchOutlined,
  StopOutlined,
  ThunderboltOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const marked = new Marked()
marked.setOptions({breaks: true, gfm: true})

interface GuestbookMessage {
  id: string
  content: string
  content_type: string
  author_name: string
  avatar: string | null
  username: string
  user: { id: number; username: string; avatar: string | null; role: string } | null
  is_approved: boolean
  parent_id: string | null
  parent_author_name: string | null
  like_count: number
  created_at: string
}

interface ThreadMessage {
  id: string
  content: string
  content_type: string
  author_name: string
  avatar: string | null
  user: { id: number; username: string; avatar: string | null; role: string } | null
  parent_id: string | null
  parent_author_name: string | null
  is_approved: boolean
  like_count: number
  created_at: string
}

const messages = ref<GuestbookMessage[]>([])
const loading = ref(false)

const threadVisible = ref(false)
const threadLoading = ref(false)
const threadMessages = ref<ThreadMessage[]>([])
const currentThreadMessage = ref<GuestbookMessage | null>(null)

const replyVisible = ref(false)
const replyContent = ref('')
const replySubmitting = ref(false)
const replyAiLoading = ref(false)
const currentReplyMessage = ref<GuestbookMessage | null>(null)

const query = reactive({
  page: 1,
  pageSize: 10,
  is_approved: undefined as boolean | undefined,
  keyword: ''
})

const total = ref(0)

const columns = [
  {title: 'ID', dataIndex: 'id', key: 'id', width: 80, ellipsis: true},
  {title: '留言内容', dataIndex: 'content', key: 'content', ellipsis: true, width: 260},
  {title: '留言用户', dataIndex: 'author_name', key: 'author_name', width: 120},
  {
    title: '被回复用户',
    dataIndex: 'parent_author_name',
    key: 'parent_author_name',
    width: 120,
    customRender: ({text}: { text: string | null }) => text || '-'
  },
  {
    title: '状态',
    key: 'is_approved',
    dataIndex: 'is_approved',
    width: 100,
    align: 'center',
  },
  {
    title: '时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    customRender: ({text}: { text: string }) =>
        text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'
  },
  {
    title: '#',
    key: 'action',
    width: 90,
    align: 'center'
  }
]

async function loadData() {
  loading.value = true
  try {
    // 后端参数名为 approved，与前端字段 is_approved 不同，需显式映射
    const params: any = {page: query.page, pageSize: query.pageSize}
    if (query.is_approved !== undefined) params.approved = query.is_approved
    if (query.keyword) params.keyword = query.keyword
    const res: any = await api.get('/guestbook/admin', {params})
    const list = res.data?.list || res.data?.rows || res.data || []
    messages.value = list.map((item: any) => ({
      id: item.id,
      content: item.content,
      content_type: item.content_type || 'text',
      author_name: item.author_name || (item.user?.username) || 'Anonymous',
      avatar: item.avatar || null,
      username: item.user?.username || item.author_name || '',
      user: item.user || null,
      is_approved: item.is_approved !== false,
      parent_id: item.parent_id || null,
      parent_author_name: item.parent?.author_name || null,
      like_count: item.like_count || 0,
      created_at: item.created_at
    }))
    total.value = res.data?.pagination?.total ?? res.data?.count ?? res.data?.total ?? 0
  } finally {
    loading.value = false
  }
}

async function handleApprove(record: GuestbookMessage) {
  try {
    await api.put(`/guestbook/${record.id}`, {
      approved: !record.is_approved
    })
    message.success(record.is_approved ? '已驳回' : '已通过')
    await loadData()
  } catch {
    message.error('操作失败')
  }
}

async function handleViewThread(record: GuestbookMessage) {
  currentThreadMessage.value = record
  threadVisible.value = true
  threadLoading.value = true
  try {
    const res: any = await api.get(`/guestbook/${record.id}/replies`)
    const data = res.data?.data || res.data
    threadMessages.value = (data?.thread || data || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      content_type: item.content_type || 'text',
      author_name: item.author_name || (item.user?.username) || 'Anonymous',
      avatar: item.avatar || null,
      user: item.user || null,
      parent_id: item.parent_id || null,
      parent_author_name: item.parent?.author_name || null,
      is_approved: item.is_approved !== false,
      like_count: item.like_count || 0,
      created_at: item.created_at
    }))
  } catch {
    message.error('获取回复对话失败')
    threadVisible.value = false
  } finally {
    threadLoading.value = false
  }
}

function handleOpenReply(record: GuestbookMessage) {
  currentReplyMessage.value = record
  replyContent.value = ''
  replyVisible.value = true
}

async function handleGetAiReplyContent() {
  if (!currentReplyMessage.value) return
  replyAiLoading.value = true
  try {
    const comment = currentReplyMessage.value
    const res: any = await api.post('/ai/auto-reply', {
      commentContent: comment.content,
      articleTitle: '留言板'
    })
    const data = res.data?.data || res.data
    replyContent.value = data.reply || ''
    message.success('AI 回复内容已填充到对话框，可编辑后发送')
  } catch {
    message.error('获取AI回复内容失败')
  } finally {
    replyAiLoading.value = false
  }
}

async function handleSubmitReply() {
  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }
  if (!currentReplyMessage.value) return

  replySubmitting.value = true
  try {
    await api.post(`/guestbook/${currentReplyMessage.value.id}/reply`, {
      content: replyContent.value.trim(),
      content_type: 'markdown'
    })
    message.success('回复成功')
    replyVisible.value = false
    replyContent.value = ''
    currentReplyMessage.value = null
    await loadData()
  } catch {
    message.error('回复失败')
  } finally {
    replySubmitting.value = false
  }
}

function handleDelete(record: GuestbookMessage) {
  Modal.confirm({
    title: '确认删除',
    icon: h(ExclamationCircleOutlined),
    content: '确定要删除该留言吗？此操作不可恢复。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await api.delete(`/guestbook/${record.id}`)
        message.success('删除成功')
        loadData()
      } catch {
        message.error('删除失败')
      }
    }
  })
}

// 下拉菜单操作分发
function handleMenuAction(key: string, record: GuestbookMessage) {
  switch (key) {
    case 'thread':
      handleViewThread(record)
      break
    case 'reply':
      handleOpenReply(record)
      break
    case 'approve':
      handleApprove(record)
      break
    case 'delete':
      handleDelete(record)
      break
  }
}

function handleTableChange(pag: { current: number; pageSize: number }) {
  query.page = pag.current
  query.pageSize = pag.pageSize
  loadData()
}

function renderMarkdown(content: string): string {
  try {
    return sanitizeHtml(marked.parse(content) as string)
  } catch {
    return escapeHtml(content)
  }
}

function renderThreadContent(content: string, contentType: string): string {
  if (contentType === 'markdown') {
    return renderMarkdown(content)
  }
  return textToSafeHtml(content)
}

const replyToolbars: any[] = [
  'bold',
  'italic',
  'strikeThrough',
  '-',
  'quote',
  'code',
  'link',
  'image',
  '-',
  0,
  '-',
  '=',
  'preview',
  'previewOnly'
]

async function handleReplyUploadImg(
    files: Array<File>,
    callback: (urls: Array<{ url: string; alt: string; title: string }>) => void
) {
  const results = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        try {
          const res: any = await api.post('/upload', formData, {
            headers: {'Content-Type': 'multipart/form-data'}
          })
          const url = res.data?.url || res.url
          return {url: typeof url === 'string' ? url : '', alt: file.name, title: file.name}
        } catch {
          message.error('图片上传失败')
          return {url: '', alt: file.name, title: `上传失败: ${file.name}`}
        }
      })
  )
  callback(results.filter(r => r.url))
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>留言管理</h2>
      <a-space>
        <a-input-search
            v-model:value="query.keyword"
            placeholder="搜索留言内容..."
            style="width: 240px"
            allow-clear
            @search="() => { query.page = 1; loadData() }"
        >
          <template #enterButton>
            <SearchOutlined/>
          </template>
        </a-input-search>
        <a-select
            v-model:value="query.is_approved"
            placeholder="审核状态"
            style="width: 140px"
            allow-clear
            @change="() => { query.page = 1; loadData() }"
        >
          <a-select-option :value="true">已通过</a-select-option>
          <a-select-option :value="false">待审核</a-select-option>
        </a-select>
      </a-space>
    </div>

    <a-table
        :columns="(columns as any)"
        :data-source="messages"
        :loading="loading"
        :pagination="{
        current: query.page,
        pageSize: query.pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t: number) => `共 ${t} 条留言`
      }"
        :row-key="(r: any) => r.id"
        @change="handleTableChange"
        size="middle"
        :scroll="{ x: 1100 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'is_approved'">
          <a-tag :color="record.is_approved ? 'green' : 'orange'">
            {{ record.is_approved ? '已通过' : '待审核' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-dropdown :trigger="['click']">
            <a-button size="small" type="link" @click="(e: Event) => e.stopPropagation()">
              操作
            </a-button>
            <template #overlay>
              <a-menu @click="(info: any) => { info.domEvent?.stopPropagation(); handleMenuAction(info.key, record) }">
                <a-menu-item key="thread">
                  <template #icon>
                    <MessageOutlined/>
                  </template>
                  对话内容
                </a-menu-item>
                <a-menu-item key="reply">
                  <template #icon>
                    <CommentOutlined/>
                  </template>
                  回复
                </a-menu-item>
                <a-menu-item key="approve">
                  <template #icon>
                    <StopOutlined v-if="record.is_approved"/>
                    <CheckOutlined v-else/>
                  </template>
                  {{ record.is_approved ? '驳回' : '通过' }}
                </a-menu-item>
                <a-menu-divider/>
                <a-menu-item key="delete" danger>
                  <template #icon>
                    <DeleteOutlined/>
                  </template>
                  删除
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </template>
    </a-table>

    <!-- 回复对话弹窗 -->
    <a-modal
        v-model:open="threadVisible"
        title="回复对话"
        width="700px"
        :footer="null"
    >
      <a-spin :spinning="threadLoading">
        <div v-if="threadMessages.length > 0" class="thread-conversation">
          <div
              v-for="(msg, idx) in threadMessages"
              :key="msg.id"
              class="thread-item"
              :style="{
              marginLeft: msg.parent_id ? '40px' : '0',
              borderLeft: msg.parent_id ? '3px solid #1677ff' : 'none',
              paddingLeft: msg.parent_id ? '12px' : '0'
            }"
          >
            <div class="thread-item-header">
              <span class="thread-author">{{ msg.author_name }}</span>
              <a-tag v-if="msg.user?.role === 'admin'" color="red" size="small">管理员</a-tag>
              <span v-if="msg.parent_author_name" class="thread-reply-to">
                回复 <strong>{{ msg.parent_author_name }}</strong>
              </span>
              <span class="thread-time">{{ dayjs(msg.created_at).format('YYYY-MM-DD HH:mm') }}</span>
              <span style="margin-left: auto; font-size: 12px; color: #999">#{{ idx + 1 }}</span>
            </div>
            <div
                class="thread-item-content markdown-body"
                v-html="renderThreadContent(msg.content, msg.content_type)"
            ></div>
          </div>
        </div>
        <div v-else-if="!threadLoading" class="thread-empty">
          暂无回复
        </div>
      </a-spin>
    </a-modal>

    <!-- 手动回复弹窗 -->
    <a-modal
        v-model:open="replyVisible"
        title="回复留言"
        width="700px"
        :confirm-loading="replySubmitting"
        @ok="handleSubmitReply"
        ok-text="发送回复"
        cancel-text="取消"
    >
      <div v-if="currentReplyMessage" class="reply-preview">
        <div class="reply-preview-label">回复给：</div>
        <div class="reply-preview-author">
          <strong>{{ currentReplyMessage.author_name }}</strong>
          <a-tag v-if="currentReplyMessage.user?.role === 'admin'" color="red" size="small" style="margin-left: 6px">
            管理员
          </a-tag>
        </div>
        <div class="reply-preview-content" v-html="renderMarkdown(currentReplyMessage.content)"></div>
      </div>
      <div style="margin-top: 16px; margin-bottom: 12px">
        <a-button
            type="dashed"
            :loading="replyAiLoading"
            @click="handleGetAiReplyContent"
        >
          <template #icon>
            <ThunderboltOutlined/>
          </template>
          AI 生成回复内容
        </a-button>
      </div>
      <div style="margin-top: 16px">
        <MdEditor
            v-model="replyContent"
            :preview="false"
            :toolbars="replyToolbars"
            :show-code-row-number="false"
            placeholder="输入回复内容（支持 Markdown）..."
            :footers="[]"
            :on-upload-img="handleReplyUploadImg"
            style="height: 400px"
        />
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.thread-conversation {
  max-height: 500px;
  overflow-y: auto;
}

.thread-item {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--color-bg-subtle);
  border-radius: 3px;
}

.thread-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.thread-author {
  font-weight: 600;
  color: #1677ff;
}

.thread-reply-to {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.thread-time {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.thread-item-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
  word-break: break-word;
}

.thread-item-content :deep(strong) {
  color: var(--color-text);
}

.thread-item-content :deep(em) {
  color: var(--color-text-secondary);
}

.thread-item-content :deep(p) {
  margin: 0 0 0.5em 0;
}

.thread-item-content :deep(p:last-child) {
  margin-bottom: 0;
}

.thread-item-content :deep(code) {
  background-color: var(--color-bg-fill);
  padding: 0.1em 0.35em;
  border-radius: 3px;
  font-size: 0.9em;
  color: #e74c3c;
}

.thread-item-content :deep(pre) {
  margin: 0.5em 0;
  padding: 0.75em 1em;
  background-color: var(--color-bg-fill);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow-x: auto;
}

.thread-item-content :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--color-text);
}

.thread-item-content :deep(a) {
  color: #1677ff;
  text-decoration: underline;
}

.thread-item-content :deep(blockquote) {
  margin: 0.5em 0;
  padding: 0.5em 0.75em;
  border-left: 3px solid #1677ff;
  background-color: var(--color-bg-subtle);
  border-radius: 0 4px 4px 0;
  color: var(--color-text-secondary);
}

.thread-item-content :deep(ul),
.thread-item-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.thread-item-content :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}

.thread-empty {
  text-align: center;
  padding: 40px;
  color: var(--color-text-tertiary);
}

.reply-preview {
  padding: 12px;
  background: var(--color-bg-fill);
  border-radius: 3px;
  border-left: 3px solid #1677ff;
}

.reply-preview-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-bottom: 4px;
}

.reply-preview-author {
  font-size: 14px;
  margin-bottom: 6px;
}

.reply-preview-content {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  word-break: break-word;
}
</style>
