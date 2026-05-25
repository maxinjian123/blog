<script setup lang="ts">
import {h, onMounted, reactive, ref} from 'vue'
import api from '@/utils/api'
import {message, Modal} from 'ant-design-vue'
import {Marked} from 'marked'
import {MdEditor} from 'md-editor-v3'
import {Emoji} from '@vavt/v3-extension'
import '@vavt/v3-extension/lib/asset/Emoji.css'
import 'md-editor-v3/lib/style.css'
import {ExclamationCircleOutlined, RobotOutlined, SearchOutlined, ThunderboltOutlined} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import {CLIENT_BASE_URL} from "@/config.ts";

const marked = new Marked()
marked.setOptions({breaks: true, gfm: true})

interface Comment {
  id: string
  content: string
  content_type: string
  author_name: string
  avatar: string | null
  username: string
  user: { id: number; username: string; avatar: string | null; role: string } | null
  article_title: string
  article_slug: string
  article_id: string
  is_approved: boolean
  is_ai_reply: boolean
  parent_id: string | null
  parent_author_name: string | null
  created_at: string
}

interface ThreadComment {
  id: string
  content: string
  content_type: string
  author_name: string
  avatar: string | null
  user: { id: number; username: string; avatar: string | null; role: string } | null
  parent_id: string | null
  parent_author_name: string | null
  is_ai_reply: boolean
  is_approved: boolean
  like_count: number
  created_at: string
}

const comments = ref<Comment[]>([])
const loading = ref(false)
const aiReplyLoading = ref<Record<string, boolean>>({})

// 回复对话弹窗
const threadVisible = ref(false)
const threadLoading = ref(false)
const threadComments = ref<ThreadComment[]>([])
const currentThreadComment = ref<Comment | null>(null)

// 手动回复弹窗
const replyVisible = ref(false)
const replyContent = ref('')
const replySubmitting = ref(false)
const replyAiLoading = ref(false)
const currentReplyComment = ref<Comment | null>(null)

// 文章预览弹窗
const articlePreviewVisible = ref(false)
const articlePreviewTitle = ref('')
const articlePreviewContent = ref('')

const query = reactive({
  page: 1,
  pageSize: 10,
  is_approved: undefined as boolean | undefined,
  keyword: ''
})

const total = ref(0)

// 当前管理员用户信息
const currentAdminUser = ref<{ id: number; username: string } | null>(null)

const columns = [
  {title: 'ID', dataIndex: 'id', key: 'id', width: 80, ellipsis: true},
  {title: '评论内容', dataIndex: 'content', key: 'content', ellipsis: true, width: 220},
  {title: '评论用户', dataIndex: 'author_name', key: 'author_name', width: 120},
  {
    title: '被回复用户',
    dataIndex: 'parent_author_name',
    key: 'parent_author_name',
    width: 120,
    customRender: ({text}: { text: string | null }) => text || '-'
  },
  {
    title: '所属文章',
    dataIndex: 'article_title',
    key: 'article_title',
    width: 180,
    ellipsis: true,
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
    title: '操作',
    key: 'action',
    width: 300,
  }
]

async function loadData() {
  loading.value = true
  try {
    const params: any = {...query}
    if (params.is_approved === undefined) delete params.is_approved
    if (!params.keyword) delete params.keyword
    const res: any = await api.get('/comments', {params})
    const list = res.data?.rows || res.data?.list || res.data || []
    comments.value = list.map((item: any) => ({
      id: item.id,
      content: item.content,
      content_type: item.content_type || 'text',
      author_name: item.author_name || (item.user?.username) || 'Anonymous',
      avatar: item.avatar || null,
      username: item.user?.username || item.author_name || '',
      user: item.user || null,
      article_title: item.article?.title || '',
      article_slug: item.article?.slug || '',
      article_id: item.article_id,
      is_approved: item.is_approved !== false,
      is_ai_reply: item.is_ai_reply || false,
      parent_id: item.parent_id || null,
      parent_author_name: item.parent?.author_name || null,
      created_at: item.created_at
    }))
    total.value = res.data?.count || res.data?.total || 0
  } finally {
    loading.value = false
  }
}

async function loadCurrentAdminUser() {
  try {
    const res: any = await api.get('/auth/me')
    const user = res.data?.data || res.data
    if (user) {
      currentAdminUser.value = {id: user.id, username: user.username}
    }
  } catch { /* ignore */
  }
}

async function handleApprove(record: Comment) {
  try {
    await api.put(`/comments/${record.id}`, {
      approved: !record.is_approved
    })
    message.success(record.is_approved ? '已驳回' : '已通过')
    await loadData()
  } catch {
    message.error('操作失败')
  }
}

// 查看回复对话
async function handleViewThread(record: Comment) {
  currentThreadComment.value = record
  threadVisible.value = true
  threadLoading.value = true
  try {
    const res: any = await api.get(`/comments/${record.id}/replies`)
    const data = res.data?.data || res.data
    threadComments.value = (data?.thread || data || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      content_type: item.content_type || 'text',
      author_name: item.author_name || (item.user?.username) || 'Anonymous',
      avatar: item.avatar || null,
      user: item.user || null,
      parent_id: item.parent_id || null,
      parent_author_name: item.parent?.author_name || null,
      is_ai_reply: item.is_ai_reply || false,
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

// 预览文章
async function handlePreviewArticle(record: Comment) {
  articlePreviewTitle.value = record.article_title
  articlePreviewContent.value = ''
  articlePreviewVisible.value = true
  try {
    const res: any = await api.get(`/articles/${record.article_id}`)
    const article = res.data?.data || res.data
    if (article) {
      articlePreviewTitle.value = article.title || record.article_title
      articlePreviewContent.value = article.content || ''
    }
  } catch {
    message.error('获取文章内容失败')
  }
}

// 跳转到客户端文章详情页
function handleGoToArticle(record: Comment) {
  window.open(`${CLIENT_BASE_URL}/article/${record.article_id}?c=${record.id}`, '_blank')
}

// AI回复
async function handleAiReply(record: Comment) {
  aiReplyLoading.value[record.id] = true
  try {
    await api.post(`/comments/${record.id}/ai-reply`)
    message.success('AI 自动回复已发送')
    await loadData()
  } catch {
    message.error('AI 回复失败')
  } finally {
    aiReplyLoading.value[record.id] = false
  }
}

// 打开手动回复弹窗
function handleOpenReply(record: Comment) {
  currentReplyComment.value = record
  replyContent.value = ''
  replyVisible.value = true
}

// 获取AI回复内容（填充到对话框中）
async function handleGetAiReplyContent() {
  if (!currentReplyComment.value) return
  replyAiLoading.value = true
  try {
    const comment = currentReplyComment.value
    const res: any = await api.post('/ai/auto-reply', {
      commentContent: comment.content,
      articleTitle: comment.article_title
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

// 提交手动回复
async function handleSubmitReply() {
  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }
  if (!currentReplyComment.value) return

  replySubmitting.value = true
  try {
    await api.post(`/comments/${currentReplyComment.value.id}/reply`, {
      content: replyContent.value.trim(),
      content_type: 'markdown'
    })
    message.success('回复成功')
    replyVisible.value = false
    replyContent.value = ''
    currentReplyComment.value = null
    await loadData()
  } catch {
    message.error('回复失败')
  } finally {
    replySubmitting.value = false
  }
}

function handleDelete(record: Comment) {
  Modal.confirm({
    title: '确认删除',
    icon: h(ExclamationCircleOutlined),
    content: '确定要删除该评论吗？此操作不可恢复。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await api.delete(`/comments/${record.id}`)
        message.success('删除成功')
        loadData()
      } catch {
        message.error('删除失败')
      }
    }
  })
}

function handleTableChange(pag: { current: number; pageSize: number }) {
  query.page = pag.current
  query.pageSize = pag.pageSize
  loadData()
}

// 判断当前管理员是否可以回复该评论
function canReply(record: Comment): boolean {
  // 不可以回复AI的评论
  if (record.is_ai_reply) return false
  // 不可以回复自己的评论（通过user_id判断）
  if (record.user && currentAdminUser.value && record.user.id === currentAdminUser.value.id) return false
  return true
}

// 用marked渲染markdown内容
function renderMarkdown(content: string): string {
  try {
    return marked.parse(content) as string
  } catch {
    return content
  }
}

function renderThreadContent(content: string, contentType: string): string {
  if (contentType === 'markdown') {
    return renderMarkdown(content)
  }
  return content.replace(/\n/g, '<br>')
}

// md-editor-v3 工具栏配置
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

// md-editor-v3 图片上传
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
  loadCurrentAdminUser()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>评论管理</h2>
      <a-space>
        <a-input-search
            v-model:value="query.keyword"
            placeholder="搜索评论内容..."
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
        :data-source="comments"
        :loading="loading"
        :pagination="{
        current: query.page,
        pageSize: query.pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t: number) => `共 ${t} 条评论`
      }"
        :row-key="(r: any) => r.id"
        @change="handleTableChange"
        size="middle"
        :scroll="{ x: 1300 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'article_title'">
          <a-button type="link" @click="(e: Event) => { e.stopPropagation(); handlePreviewArticle(record) }">
            {{ record.article_title }}
          </a-button>
        </template>
        <template v-if="column.key === 'is_approved'">
          <a-tag :color="record.is_approved ? 'green' : 'orange'">
            {{ record.is_approved ? '已通过' : '待审核' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space :size="4" wrap>
            <a-button size="small" type="link" @click="(e: Event) => { e.stopPropagation(); handleViewThread(record) }">
              对话内容
            </a-button>
            <a-button size="small" type="link" danger
                      @click="(e: Event) => { e.stopPropagation(); handleDelete(record) }">
              删除
            </a-button>
            <a-button style="color: #E6A23C" size="small" type="link"
                      @click="(e: Event) => { e.stopPropagation(); handleGoToArticle(record) }">
              跳转
            </a-button>
            <a-button
                v-if="canReply(record)"
                size="small"
                type="link"
                @click="(e: Event) => { e.stopPropagation(); handleOpenReply(record) }"
            >
              回复
            </a-button>
            <a-button
                v-if="canReply(record)"
                size="small"
                type="link"
                :loading="aiReplyLoading[record.id]"
                @click="(e: Event) => { e.stopPropagation(); handleAiReply(record) }"
            >
              <template #icon>
                <RobotOutlined/>
              </template>
              AI回复
            </a-button>
            <a-button v-if="record.is_approved" size="small" type="link"
                      @click="(e: Event) => { e.stopPropagation(); handleApprove(record) }">
              驳回
            </a-button>
            <a-button v-else size="small" type="link"
                      @click="(e: Event) => { e.stopPropagation(); handleApprove(record) }">
              通过
            </a-button>
          </a-space>
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
        <div v-if="threadComments.length > 0" class="thread-conversation">
          <div
              v-for="(comment, idx) in threadComments"
              :key="comment.id"
              class="thread-item"
              :style="{
              marginLeft: comment.parent_id ? '40px' : '0',
              borderLeft: comment.parent_id ? '3px solid #1677ff' : 'none',
              paddingLeft: comment.parent_id ? '12px' : '0'
            }"
          >
            <div class="thread-item-header">
              <span class="thread-author">{{ comment.author_name }}</span>
              <a-tag v-if="comment.user?.role === 'admin'" color="red" size="small">管理员</a-tag>
              <a-tag v-if="comment.is_ai_reply" color="purple" size="small">AI</a-tag>
              <span v-if="comment.parent_author_name" class="thread-reply-to">
                回复 <strong>{{ comment.parent_author_name }}</strong>
              </span>
              <span class="thread-time">{{ dayjs(comment.created_at).format('YYYY-MM-DD HH:mm') }}</span>
              <span style="margin-left: auto; font-size: 12px; color: #999">#{{ idx + 1 }}</span>
            </div>
            <div
                class="thread-item-content markdown-body"
                v-html="renderThreadContent(comment.content, comment.content_type)"
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
        title="回复评论"
        width="700px"
        :confirm-loading="replySubmitting"
        @ok="handleSubmitReply"
        ok-text="发送回复"
        cancel-text="取消"
    >
      <div v-if="currentReplyComment" class="reply-preview">
        <div class="reply-preview-label">回复给：</div>
        <div class="reply-preview-author">
          <strong>{{ currentReplyComment.author_name }}</strong>
          <a-tag v-if="currentReplyComment.user?.role === 'admin'" color="red" size="small" style="margin-left: 6px">
            管理员
          </a-tag>
        </div>
        <div class="reply-preview-content">{{
            currentReplyComment.content?.substring(0, 150)
          }}{{ currentReplyComment.content?.length > 150 ? '...' : '' }}
        </div>
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
            language="zh-CN"
            :preview="false"
            :toolbars="replyToolbars"
            :show-code-row-number="false"
            placeholder="输入回复内容（支持 Markdown）..."
            :footers="[]"
            :on-upload-img="handleReplyUploadImg"
            style="height: 300px"
        >
          <template #defToolbars>
            <Emoji title="表情"/>
          </template>
        </MdEditor>
      </div>
    </a-modal>

    <!-- 文章预览弹窗 -->
    <a-modal
        v-model:open="articlePreviewVisible"
        :title="articlePreviewTitle"
        width="800px"
        :footer="null"
    >
      <div class="article-preview-content" v-html="articlePreviewContent"></div>
      <div v-if="!articlePreviewContent" style="text-align: center; padding: 40px; color: #999">
        加载中...
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
  background: #fafafa;
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
  color: #666;
}

.thread-time {
  font-size: 12px;
  color: #999;
}

.thread-item-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  word-break: break-word;
}

/* markdown 渲染样式 */
.thread-item-content :deep(strong) {
  color: #222;
}

.thread-item-content :deep(em) {
  color: #555;
}

.thread-item-content :deep(p) {
  margin: 0 0 0.5em 0;
}

.thread-item-content :deep(p:last-child) {
  margin-bottom: 0;
}

.thread-item-content :deep(code) {
  background-color: #f0f0f0;
  padding: 0.1em 0.35em;
  border-radius: 3px;
  font-size: 0.9em;
  color: #e74c3c;
}

.thread-item-content :deep(pre) {
  margin: 0.5em 0;
  padding: 0.75em 1em;
  background-color: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow-x: auto;
}

.thread-item-content :deep(pre code) {
  background: none;
  padding: 0;
  color: #333;
}

.thread-item-content :deep(a) {
  color: #1677ff;
  text-decoration: underline;
}

.thread-item-content :deep(blockquote) {
  margin: 0.5em 0;
  padding: 0.5em 0.75em;
  border-left: 3px solid #1677ff;
  background-color: #f0f5ff;
  border-radius: 0 4px 4px 0;
  color: #555;
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

.thread-item-content :deep(h1),
.thread-item-content :deep(h2),
.thread-item-content :deep(h3),
.thread-item-content :deep(h4),
.thread-item-content :deep(h5) {
  margin: 0.5em 0 0.3em 0;
  font-weight: 600;
  color: #222;
}

.thread-empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.reply-preview {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 3px;
  border-left: 3px solid #1677ff;
}

.reply-preview-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.reply-preview-author {
  font-size: 14px;
  margin-bottom: 6px;
}

.reply-preview-content {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  word-break: break-word;
}

.article-preview-content {
  max-height: 600px;
  overflow-y: auto;
}

.article-preview-content :deep(img) {
  max-width: 100%;
}

.article-preview-content :deep(video) {
  max-width: 100%;
}
</style>