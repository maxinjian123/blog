<script setup lang="ts">
import AiAssistant from '@/components/admin/AiAssistant.vue'
import CoverGenerator from '@/components/admin/CoverGenerator.vue'
import {useArticleStore} from '@/stores/article'
import api from '@/utils/api'
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ImportOutlined,
  InfoCircleOutlined,
  MenuOutlined,
  PictureOutlined,
  RobotOutlined,
  SaveOutlined,
  SendOutlined,
  TagsOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue'
import {ExportPDF, Mark, OriginalImg} from '@vavt/v3-extension'
import '@vavt/v3-extension/lib/asset/ExportPDF.css'
import '@vavt/v3-extension/lib/asset/Mark.css'
import '@vavt/v3-extension/lib/asset/OriginalImg.css'
import EmojiToolbar from '@/components/admin/EmojiToolbar.vue'
import {MdEditor, MdPreview} from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import 'md-editor-v3/lib/preview.css'
import {message, Modal} from 'ant-design-vue'
import {computed, onBeforeUnmount, onMounted, reactive, ref} from 'vue'
import {onBeforeRouteLeave, useRoute, useRouter} from 'vue-router'
import {useDarkMode} from '@/composables/useDarkMode'
import {useTabsStore} from '@/stores/tabs'

interface CategoryOption {
  id: string
  name: string
}

interface TagOption {
  id: string
  name: string
  slug: string
}

interface CatalogItem {
  text: string
  level: number
}

interface VersionItem {
  id: string
  title: string
  summary?: string | null
  content_type?: string
  created_at: string
  version_note?: string | null
  content?: string
}

const router = useRouter()
const route = useRoute()
const {isDark} = useDarkMode()
const tabsStore = useTabsStore()
const articleStore = useArticleStore()

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  content: '',
  summary: '',
  categoryId: null as string | null,
  tagIds: [] as string[],
  cover: '',
  status: 'draft' as 'draft' | 'published',
  scheduledAt: null as string | null,
})

const categories = ref<CategoryOption[]>([])
const tags = ref<TagOption[]>([])
const categoriesLoading = ref(false)
const tagsLoading = ref(false)
const pageLoading = ref(false)
const saveLoading = ref(false)
const summaryLoading = ref(false)
const catalog = ref<CatalogItem[]>([])
const lastSavedAt = ref<string | null>(null)
const aiResult = ref('')

const showCoverModal = ref(false)
const showAiDrawer = ref(false)
const showVersionDrawer = ref(false)
const showPreviewModal = ref(false)
const showVersionPreviewModal = ref(false)
const versions = ref<VersionItem[]>([])
const versionsLoading = ref(false)
const versionPreview = ref<VersionItem | null>(null)
const versionPreviewLoading = ref(false)
const sidebarOpen = ref(false)
const importMdInput = ref<HTMLInputElement | null>(null)

// 工具栏：完整默认工具集，仅移除左侧“保存”与右侧“源码地址(GitHub)”两项
const mdToolbars: any[] = [
  'bold',
  'underline',
  'italic',
  'strikeThrough',
  '-',
  'title',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'mermaid',
  'katex',
  '-',
  'revoke',
  'next',
  '-',
  0,
  1,
  2,
  3,
  '-',
  '=',
  'prettier',
  'fullscreen',
  'pageFullscreen',
  'preview',
  'previewOnly',
  'htmlPreview',
  'catalog',
]

const wordCount = computed(() => {
  const text = form.content || ''
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const words = text.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(Boolean).length
  return cjk + words
})

const readingTime = computed(() => {
  const minutes = Math.ceil(wordCount.value / 300)
  return minutes < 1 ? '< 1' : String(minutes)
})

const isScheduled = computed(() => form.status === 'draft' && !!form.scheduledAt)

const statusTag = computed(() => {
  if (isScheduled.value) return {text: '定时发布', color: 'orange'}
  if (form.status === 'published') return {text: '已发布', color: 'green'}
  return {text: '草稿', color: 'default'}
})

const statusHint = computed(() => {
  if (form.status === 'published') return '文章已对外发布，修改内容后点击“更新”即可生效。'
  if (isScheduled.value) return '已设置定时发布，保存草稿后到达指定时间将自动发布。'
  return '草稿仅自己可见，可随时保存或发布。'
})

const publishLabel = computed(() =>
    isEdit.value && form.status === 'published' ? '更新' : '发布'
)

const publishConfirmTitle = computed(() =>
    isEdit.value && form.status === 'published' ? '更新已发布文章' : '确认发布文章'
)

const publishConfirmContent = computed(() => {
  if (isEdit.value && form.status === 'published') {
    return '保存后，已发布的内容将立即更新，读者会看到最新版本。'
  }
  if (isEdit.value) {
    return '发布后文章将对访客可见，同时清除定时发布设置。'
  }
  return '发布后文章将立即创建，并对访客可见。'
})

const formatScheduled = computed(() => {
  if (!form.scheduledAt) return ''
  return new Date(form.scheduledAt).toLocaleString('zh-CN')
})

const saveStateText = computed(() => {
  if (saveLoading.value) return '保存中…'
  if (isDirty()) return '未保存'
  return '已保存'
})

const saveStateClass = computed(() => {
  if (saveLoading.value) return 'saving'
  if (isDirty()) return 'dirty'
  return 'saved'
})

onMounted(async () => {
  await Promise.all([loadCategories(), loadTags()])
  if (isEdit.value) {
    pageLoading.value = true
    try {
      await loadArticle()
    } finally {
      pageLoading.value = false
    }
  }
  updateBaseline()
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('keydown', handleKeydown)
})

async function loadCategories() {
  categoriesLoading.value = true
  try {
    const res: any = await api.get('/categories', {params: {pageSize: 100}})
    categories.value = res.data?.rows || res.data?.list || res.data || []
  } catch {
    categories.value = []
  } finally {
    categoriesLoading.value = false
  }
}

async function loadTags() {
  tagsLoading.value = true
  try {
    const res: any = await api.get('/tags', {params: {pageSize: 1000}})
    const data = res.data || res
    tags.value = data.list || data.rows || data || []
  } catch {
    tags.value = []
  } finally {
    tagsLoading.value = false
  }
}

async function loadArticle() {
  const id = route.params.id as string
  const article: any = await articleStore.fetchArticle(id)
  if (article) {
    form.title = article.title || ''
    form.summary = article.summary || ''
    form.cover = article.cover || ''
    form.categoryId = article.category_id || null
    form.tagIds = (article.tags || []).map((t: TagOption) => t.id)
    form.status = article.status === 'published' ? 'published' : 'draft'
    catalog.value = article.catalog || []
    form.content = article.content || ''
    if (article.scheduled_at) {
      const d = new Date(article.scheduled_at)
      const pad = (n: number) => String(n).padStart(2, '0')
      form.scheduledAt =
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
          `T${pad(d.getHours())}:${pad(d.getMinutes())}`
    } else {
      form.scheduledAt = null
    }
  }
}

async function handleMdUploadImg(
    files: Array<File>,
    callback: (urls: Array<{ url: string; alt: string; title: string }>) => void
) {
  const results = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        try {
          const res: any = await api.post('/upload', formData, {
            headers: {'Content-Type': 'multipart/form-data'},
          })
          const url = res.data?.url || res.url
          return {url: typeof url === 'string' ? url : '', alt: file.name, title: file.name}
        } catch {
          message.error('图片上传失败')
          return {url: '', alt: file.name, title: `上传失败: ${file.name}`}
        }
      })
  )
  callback(results.filter((r) => r.url))
}

function onGetCatalog(list: CatalogItem[]) {
  catalog.value = list
}

function handleImportMdClick() {
  importMdInput.value?.click()
}

async function handleImportMdChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const isMd = /\.(md|markdown|mdx)$/i.test(file.name) || file.type === 'text/markdown'
  if (!isMd) {
    message.error('请选择 Markdown 文件（.md / .markdown）')
    target.value = ''
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    message.error('文件大小不能超过 10MB')
    target.value = ''
    return
  }

  try {
    const text = await file.text()
    if (!text.trim()) {
      message.error('文件内容为空')
      target.value = ''
      return
    }

    const applyImported = () => {
      if (!form.title.trim()) {
        const m = text.match(/^#\s+(.+?)\s*#*\s*$/m)
        if (m) form.title = m[1].replace(/[`*_~]/g, '').trim()
      }
    }

    if (form.content.trim()) {
      Modal.confirm({
        title: '导入 Markdown',
        content: '编辑器已有内容，请选择导入方式',
        okText: '覆盖',
        cancelText: '追加',
        onOk: () => {
          form.content = text
          applyImported()
          message.success(`已导入 ${file.name}`)
        },
        onCancel: () => {
          form.content = `${form.content}\n\n${text}`
          applyImported()
          message.success(`已追加 ${file.name}`)
        },
      })
    } else {
      form.content = text
      applyImported()
      message.success(`已导入 ${file.name}`)
    }
  } catch {
    message.error('读取文件失败')
  } finally {
    target.value = ''
  }
}

async function handleSave(draft = true) {
  if (!isEdit.value && (!form.title.trim() || !form.content.trim())) {
    message.warning('新建文章需要先填写标题和正文，才能保存')
    return
  }

  saveLoading.value = true
  const payload: Record<string, any> = {
    title: form.title,
    content: form.content,
    summary: form.summary,
    cover: form.cover,
    category_id: form.categoryId,
    tags: form.tagIds
        .map((id) => tags.value.find((t) => t.id === id)?.name || '')
        .filter(Boolean),
    status: draft ? 'draft' : 'published',
    content_type: 'markdown',
    catalog: catalog.value,
    scheduled_at: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
  }

  try {
    if (isEdit.value) {
      await articleStore.updateArticle(route.params.id as string, payload)
    } else {
      const created = await articleStore.createArticle(payload)
      if (created?.id) {
        await router.replace(`/articles/${created.id}/edit`)
      }
    }
    message.success(
        draft ? '草稿已保存' : isEdit.value ? '文章已更新' : '文章已发布'
    )
    lastSavedAt.value = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
    updateBaseline()
  } catch {
    message.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

function handlePublishClick() {
  if (!form.title.trim()) {
    message.warning('请先填写文章标题')
    return
  }
  if (!form.content.trim()) {
    message.warning('请先填写文章正文')
    return
  }
  Modal.confirm({
    title: publishConfirmTitle.value,
    content: publishConfirmContent.value,
    okText: '确认发布',
    cancelText: '再检查一下',
    onOk: () => handleSave(false),
  })
}

function handlePreview() {
  if (!form.content.trim()) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  showPreviewModal.value = true
}

async function handleGenerateSummary() {
  if (!form.content.trim()) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  summaryLoading.value = true
  try {
    const res: any = await api.post('/ai/summary', {content: form.content})
    const data = res.data || res
    form.summary = data.summary || data.content || ''
    if (form.summary) {
      message.success('摘要已生成')
    } else {
      message.error('摘要生成失败')
    }
  } catch (err: any) {
    message.error(err?.response?.data?.message || '摘要生成失败')
  } finally {
    summaryLoading.value = false
  }
}

function handleAiResult(content: string) {
  aiResult.value = content
  if (content) {
    loadTags()
  }
}

function handleTagsGenerated(generatedTags: Array<{ id: string; name: string; slug: string }>) {
  loadTags().then(() => {
    const currentIds = new Set(form.tagIds)
    generatedTags.forEach((t) => currentIds.add(t.id))
    form.tagIds = Array.from(currentIds)
    message.success(`已自动选中 ${generatedTags.length} 个标签`)
  })
}

function handleInsertAiContent(inserted: string) {
  form.content = inserted
  aiResult.value = ''
}

function handleCoverSelected(url: string) {
  form.cover = url
  showCoverModal.value = false
}

function removeCover() {
  form.cover = ''
}

async function openVersionDrawer() {
  if (!isEdit.value) {
    message.warning('新建文章暂无需查看版本历史')
    return
  }
  showVersionDrawer.value = true
  await fetchVersions()
}

async function fetchVersions() {
  versionsLoading.value = true
  try {
    const res = await api.get(`/articles/${route.params.id}/versions`)
    const data = res.data?.data || res.data || []
    versions.value = Array.isArray(data) ? data : []
  } catch {
    message.error('获取版本历史失败')
    versions.value = []
  } finally {
    versionsLoading.value = false
  }
}

async function previewVersion(versionId: string) {
  versionPreviewLoading.value = true
  try {
    const res = await api.get(`/articles/${route.params.id}/versions/${versionId}`)
    versionPreview.value = res.data?.data || res.data
    showVersionPreviewModal.value = true
  } catch {
    message.error('获取版本详情失败')
  } finally {
    versionPreviewLoading.value = false
  }
}

async function restoreVersion(versionId: string) {
  try {
    const res = await api.post(`/articles/${route.params.id}/versions/${versionId}/restore`)
    const data = res.data?.data || res.data
    form.title = data.title || ''
    form.content = data.content || ''
    form.summary = data.summary || ''
    form.cover = data.cover || ''
    form.categoryId = data.category_id || null
    message.success('已恢复到指定版本')
    showVersionDrawer.value = false
    versionPreview.value = null
    showVersionPreviewModal.value = false
    updateBaseline()
    await fetchVersions()
  } catch {
    message.error('恢复版本失败')
  }
}

const filterOption = (input: string, option: { value?: string; name?: string; key?: string }) => {
  return (option.name || '').toLowerCase().includes(input.toLowerCase())
}

async function goBack() {
  // 先计算返回目标（相邻标签优先），导航由路由守卫统一处理脏表单确认
  const currentFullPath = route.fullPath
  const next = tabsStore.getNextAfterClose(route.fullPath)
  try {
    if (next) {
      await router.push(next)
    } else if (window.history.length > 1) {
      await router.back()
      return
    } else {
      await router.push('/articles')
    }
    // 导航成功后再关闭当前标签（含 KeepAlive 缓存清理），取消确认时标签保留
    tabsStore.removeTab(currentFullPath)
  } catch {
    // 用户取消离开确认，标签保留
  }
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    handleSave(true)
  }
}

const baselineSnapshot = ref('')

function getComparableSnapshot(): string {
  return JSON.stringify({
    title: form.title,
    content: form.content,
    summary: form.summary,
    cover: form.cover,
    categoryId: form.categoryId,
    tagIds: form.tagIds,
    status: form.status,
    scheduledAt: form.scheduledAt,
  })
}

function updateBaseline() {
  baselineSnapshot.value = getComparableSnapshot()
}

function isDirty(): boolean {
  return getComparableSnapshot() !== baselineSnapshot.value
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (isDirty()) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onBeforeRouteLeave(() => {
  if (!isDirty()) return
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '离开页面？',
      content: '当前文章有未保存的修改，确定要离开吗？',
      okText: '离开',
      cancelText: '继续编辑',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
})
</script>

<template>
  <div class="editor-page">
    <!-- 顶部操作栏 -->
    <header class="editor-header">
      <div class="header-left">
        <a-button type="text" class="back-btn" @click="goBack">
          <ArrowLeftOutlined/>
        </a-button>
        <div class="page-identity">
          <EditOutlined class="identity-icon"/>
          <span class="page-title">{{ isEdit ? '编辑文章' : '新建文章' }}</span>
          <a-tag :color="statusTag.color" class="status-tag">{{ statusTag.text }}</a-tag>
        </div>
      </div>

      <div class="header-stats">
        <span class="stat-item"><FileTextOutlined/> {{ wordCount }} 字</span>
        <span class="stat-sep">·</span>
        <span class="stat-item">预计阅读 {{ readingTime }} 分钟</span>
        <template v-if="lastSavedAt">
          <span class="stat-sep">·</span>
          <span class="stat-item">上次保存 {{ lastSavedAt }}</span>
        </template>
      </div>

      <div class="header-right">
        <span
            v-if="saveLoading || lastSavedAt || isDirty()"
            class="save-state"
            :class="saveStateClass"
        >
          <span class="save-dot"/>
          {{ saveStateText }}
        </span>
        <a-button class="header-action" @click="handleImportMdClick">
          <ImportOutlined/>
          <span class="action-text">导入</span>
        </a-button>
        <a-button class="header-action sidebar-toggle-btn" @click="sidebarOpen = true">
          <MenuOutlined/>
          <span class="action-text">设置</span>
        </a-button>
        <a-button class="header-action" @click="handlePreview">
          <EyeOutlined/>
          <span class="action-text">预览</span>
        </a-button>
        <a-button v-if="isEdit" class="header-action" @click="openVersionDrawer">
          <HistoryOutlined/>
          <span class="action-text">历史</span>
        </a-button>
        <a-button class="header-action" @click="showAiDrawer = true">
          <RobotOutlined/>
          <span class="action-text">AI</span>
        </a-button>
        <a-divider type="vertical" class="action-divider"/>
        <a-button :loading="saveLoading" @click="handleSave(true)">
          <SaveOutlined/>
          <span class="action-text">存草稿</span>
        </a-button>
        <a-button type="primary" :loading="saveLoading" class="publish-btn" @click="handlePublishClick">
          <SendOutlined/>
          <span class="action-text">{{ publishLabel }}</span>
        </a-button>
      </div>
    </header>

    <!-- 主体：编辑器画布 + 右侧设置面板 -->
    <div class="editor-body">
      <a-skeleton
          v-if="pageLoading"
          active
          class="editor-skeleton"
          :paragraph="{rows: 14}"
      />
      <template v-else>
        <main class="editor-main">
          <div class="editor-canvas">
            <div class="title-block">
              <input
                  v-model="form.title"
                  class="title-input"
                  maxlength="200"
                  placeholder="请输入文章标题…"
              />
              <span class="title-counter">{{ form.title.length }}/200</span>
            </div>
            <MdEditor
                v-model="form.content"
                language="zh-CN"
                :theme="isDark ? 'dark' : 'light'"
                :preview="true"
                preview-theme="vuepress"
                code-theme="github"
                :show-code-row-number="true"
                :footers="['markdownTotal']"
                :toolbars="mdToolbars"
                :on-upload-img="handleMdUploadImg"
                @onGetCatalog="onGetCatalog"
                class="md-editor"
            >
              <template #defToolbars>
                <EmojiToolbar title="表情"/>
                <Mark title="标记"/>
                <OriginalImg title="查看原图"/>
                <ExportPDF
                    :model-value="form.content"
                    language="zh-CN"
                    :theme="isDark ? 'dark' : 'light'"
                    preview-theme="vuepress"
                    code-theme="github"
                    title="导出为PDF"
                    modal-title="导出为PDF"
                    export-btn-text="导出"
                />
              </template>
            </MdEditor>
          </div>
        </main>

        <aside class="editor-sidebar" :class="{open: sidebarOpen}">
          <div class="sidebar-mask" @click="sidebarOpen = false"/>
          <div class="sidebar-panel">
            <div class="sidebar-header">
              <span class="sidebar-header-title">文章设置</span>
              <a-button type="text" size="small" class="sidebar-close" @click="sidebarOpen = false">
                <CloseOutlined/>
              </a-button>
            </div>

            <div class="sidebar-body">
              <section class="side-section">
                <h3 class="side-title">
                  <ClockCircleOutlined/>
                  发布设置
                </h3>
                <div class="status-row">
                  <span class="side-label">当前状态</span>
                  <a-tag :color="statusTag.color">{{ statusTag.text }}</a-tag>
                </div>
                <p class="side-hint">{{ statusHint }}</p>

                <div class="field-block">
                  <label class="field-label">
                    定时发布
                    <a-tooltip title="设置后保存草稿，到达时间将自动发布；直接点击发布会立即发布并清除定时。">
                      <InfoCircleOutlined class="field-tip"/>
                    </a-tooltip>
                  </label>
                  <a-date-picker
                      v-model:value="form.scheduledAt"
                      show-time
                      value-format="YYYY-MM-DDTHH:mm"
                      format="YYYY-MM-DD HH:mm"
                      placeholder="选择定时发布时间"
                      style="width: 100%"
                      :disabled="form.status === 'published'"
                  />
                  <div v-if="form.scheduledAt" class="schedule-hint">
                    <ClockCircleOutlined/>
                    保存草稿后，将在 {{ formatScheduled }} 自动发布
                    <a class="schedule-clear" @click="form.scheduledAt = null">清除</a>
                  </div>
                </div>
              </section>

              <a-divider class="section-divider"/>

              <section class="side-section">
                <h3 class="side-title">
                  <AppstoreOutlined/>
                  分类
                </h3>
                <a-select
                    v-model:value="form.categoryId"
                    :loading="categoriesLoading"
                    placeholder="选择分类"
                    allow-clear
                    class="field-select"
                >
                  <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </a-select-option>
                </a-select>
              </section>

              <a-divider class="section-divider"/>

              <section class="side-section">
                <h3 class="side-title">
                  <TagsOutlined/>
                  标签
                </h3>
                <a-select
                    v-model:value="form.tagIds"
                    mode="multiple"
                    placeholder="选择标签"
                    allow-clear
                    show-search
                    :filter-option="filterOption"
                    :loading="tagsLoading"
                    class="field-select"
                >
                  <a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id" :name="tag.name">
                    {{ tag.name }}
                  </a-select-option>
                </a-select>
              </section>

              <a-divider class="section-divider"/>

              <section class="side-section">
                <div class="side-title-row">
                  <h3 class="side-title">
                    <FileTextOutlined/>
                    摘要
                  </h3>
                  <a-button type="dashed" size="small" :loading="summaryLoading" @click="handleGenerateSummary">
                    <ThunderboltOutlined/>
                    AI 生成
                  </a-button>
                </div>
                <a-textarea
                    v-model:value="form.summary"
                    :rows="4"
                    maxlength="300"
                    show-count
                    placeholder="文章摘要会展示在列表与 SEO 中，留空则自动截取正文开头"
                />
              </section>

              <a-divider class="section-divider"/>

              <section class="side-section">
                <div class="side-title-row">
                  <h3 class="side-title">
                    <PictureOutlined/>
                    封面图
                  </h3>
                  <a-button
                      v-if="form.cover"
                      type="text"
                      size="small"
                      danger
                      class="cover-remove"
                      @click="removeCover"
                  >
                    <DeleteOutlined/>
                    移除
                  </a-button>
                </div>
                <div v-if="form.cover" class="cover-preview">
                  <img :src="form.cover" alt="封面预览"/>
                  <div class="cover-overlay">
                    <a-button size="small" type="primary" @click="showCoverModal = true">
                      更换封面
                    </a-button>
                  </div>
                </div>
                <a-button v-else type="dashed" block class="cover-empty" @click="showCoverModal = true">
                  <PictureOutlined/>
                  设置封面
                </a-button>
              </section>

              <a-divider class="section-divider"/>

              <section class="side-section">
                <h3 class="side-title">
                  <FileTextOutlined/>
                  文档统计
                </h3>
                <div class="stat-grid">
                  <div class="stat-cell">
                    <span class="stat-num">{{ wordCount }}</span>
                    <span class="stat-name">字数</span>
                  </div>
                  <div class="stat-cell">
                    <span class="stat-num">{{ readingTime }}</span>
                    <span class="stat-name">阅读/分</span>
                  </div>
                  <div class="stat-cell">
                    <span class="stat-num">{{ catalog.length }}</span>
                    <span class="stat-name">目录项</span>
                  </div>
                  <div class="stat-cell">
                    <span class="stat-num">{{ form.tagIds.length }}</span>
                    <span class="stat-name">标签</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </aside>
      </template>
    </div>

    <!-- 封面设置弹窗 -->
    <a-modal
        v-model:open="showCoverModal"
        title="设置封面图"
        width="560px"
        :footer="null"
        destroy-on-close
    >
      <CoverGenerator
          :current-cover="form.cover"
          :article-title="form.title"
          :article-content="form.content"
          :article-summary="form.summary"
          @selected="handleCoverSelected"
          @cancel="showCoverModal = false"
      />
    </a-modal>

    <!-- AI 助手抽屉 -->
    <a-drawer
        v-model:open="showAiDrawer"
        title="AI 写作助手"
        placement="right"
        width="420"
        root-class-name="editor-drawer"
    >
      <AiAssistant
          :editor-content="form.content"
          content-type="markdown"
          @result="handleAiResult"
          @insert="handleInsertAiContent"
          @tags-generated="handleTagsGenerated"
      />
    </a-drawer>

    <!-- 版本历史抽屉 -->
    <a-drawer
        v-model:open="showVersionDrawer"
        title="版本历史"
        placement="right"
        width="560"
        root-class-name="editor-drawer"
    >
      <a-alert
          message="每次修改文章内容或标题时会自动保存一个版本，最多保留 10 个。"
          type="info"
          show-icon
          style="margin-bottom: 16px"
      />
      <a-spin :spinning="versionsLoading">
        <a-empty v-if="!versionsLoading && versions.length === 0" description="暂无版本历史"/>
        <a-timeline v-else>
          <a-timeline-item v-for="v in versions" :key="v.id">
            <div class="version-item">
              <div class="version-header">
                <span class="version-title" :title="v.title">{{ v.title }}</span>
                <a-tag color="purple">{{ v.content_type }}</a-tag>
              </div>
              <div class="version-meta">
                {{ new Date(v.created_at).toLocaleString('zh-CN') }}
                <span v-if="v.version_note"> · {{ v.version_note }}</span>
              </div>
              <div v-if="v.summary" class="version-summary">{{ v.summary }}</div>
              <div class="version-actions">
                <a-button size="small" :loading="versionPreviewLoading" @click="previewVersion(v.id)">
                  预览
                </a-button>
                <a-popconfirm
                    title="确定恢复到该版本？当前内容会自动保存为新版本。"
                    ok-text="恢复"
                    cancel-text="取消"
                    @confirm="restoreVersion(v.id)"
                >
                  <a-button size="small" type="primary" ghost>恢复</a-button>
                </a-popconfirm>
              </div>
            </div>
          </a-timeline-item>
        </a-timeline>
      </a-spin>
    </a-drawer>

    <!-- 版本内容预览 -->
    <a-modal
        v-model:open="showVersionPreviewModal"
        title="版本内容预览"
        width="800px"
        :footer="null"
        @cancel="showVersionPreviewModal = false"
    >
      <div v-if="versionPreview" class="version-preview">
        <h3>{{ versionPreview.title }}</h3>
        <div class="version-preview-meta">
          <a-tag color="purple">{{ versionPreview.content_type }}</a-tag>
          <span>{{ new Date(versionPreview.created_at).toLocaleString('zh-CN') }}</span>
        </div>
        <a-divider/>
        <MdPreview
            :model-value="versionPreview.content || ''"
            language="zh-CN"
            :theme="isDark ? 'dark' : 'light'"
            preview-theme="cyanosis"
        />
      </div>
    </a-modal>

    <!-- 草稿预览 -->
    <a-modal
        v-model:open="showPreviewModal"
        :title="`预览：${form.title || '未命名文章'}`"
        width="900px"
        :footer="null"
        class="preview-modal"
    >
      <div class="preview-article">
        <div v-if="form.cover" class="preview-cover">
          <img :src="form.cover" alt="封面"/>
        </div>
        <h1 class="preview-title">{{ form.title || '未命名文章' }}</h1>
        <div class="preview-meta">{{ form.summary || '暂无摘要' }}</div>
        <a-divider/>
        <MdPreview
            :model-value="form.content"
            :show-code-row-number="false"
            language="zh-CN"
            :theme="isDark ? 'dark' : 'light'"
            preview-theme="cyanosis"
            class="preview-content"
        />
      </div>
    </a-modal>

    <!-- 导入 Markdown 隐藏 input -->
    <input
        ref="importMdInput"
        type="file"
        accept=".md,.markdown,.mdx,text/markdown"
        style="display: none"
        @change="handleImportMdChange"
    />
  </div>
</template>

<style scoped>
.editor-page {
  --primary: #1677ff;
  --bg: #f0f2f5;
  --panel: #ffffff;
  --border: #e5e7eb;
  --text: #1f2937;
  --muted: #6b7280;
  --radius: 8px;

  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
}

/* 暗黑模式：复用 antd darkAlgorithm 对应的面板/文字/边框色 */
:root[data-theme='dark'] .editor-page {
  --primary: #1677ff;
  --bg: #141414;
  --panel: #1f1f1f;
  --border: #303030;
  --text: rgba(255, 255, 255, 0.85);
  --muted: rgba(255, 255, 255, 0.45);
}

[data-theme='dark'] .editor-page .schedule-hint {
  color: #ffd666;
  background: rgba(250, 173, 20, 0.12);
  border-color: rgba(250, 173, 20, 0.35);
}

[data-theme='dark'] .editor-page .schedule-clear {
  color: #ffd666;
}

/* ===== 顶部操作栏 ===== */
.editor-header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 56px;
  padding: 0 20px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  z-index: 10;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.back-btn {
  color: var(--muted);
  font-size: 16px;
}

.back-btn:hover {
  color: var(--primary);
}

.page-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.identity-icon {
  color: var(--primary);
  font-size: 16px;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.status-tag {
  margin-inline-end: 0;
  border-radius: 999px;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
  white-space: nowrap;
}

.stat-sep {
  opacity: 0.45;
}

.header-right {
  justify-content: flex-end;
}

.header-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.action-divider {
  height: 20px;
  margin: 0 4px;
}

.publish-btn {
  font-weight: 500;
}

.save-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.save-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #bfbfbf;
}

.save-state.saved .save-dot {
  background: #52c41a;
}

.save-state.saved {
  color: #389e0d;
}

.save-state.dirty .save-dot {
  background: #fa8c16;
}

.save-state.dirty {
  color: #d46b08;
}

.save-state.saving .save-dot {
  background: var(--primary);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.sidebar-toggle-btn {
  display: none;
}

/* ===== 主体布局 ===== */
.editor-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
  padding: 16px 20px 20px;
}

.editor-skeleton {
  flex: 1;
  padding: 24px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.editor-main {
  flex: 1;
  min-width: 0;
  display: flex;
}

.editor-canvas {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 8px 24px rgba(0, 0, 0, 0.04);
}

/* 标题输入区 */
.title-block {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--color-bg-subtle, #fafbfc);
}

.title-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
}

.title-input::placeholder {
  color: var(--color-text-disabled, #9ca3af);
  font-weight: 400;
}

.title-counter {
  flex: none;
  font-size: 12px;
  color: var(--color-text-tertiary, #9ca3af);
}

.md-editor {
  flex: 1;
  min-height: 0;
}

/* ===== 右侧设置面板 ===== */
.editor-sidebar {
  flex: none;
  width: 320px;
  min-height: 0;
  display: flex;
}

.sidebar-mask {
  display: none;
}

.sidebar-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 8px 24px rgba(0, 0, 0, 0.04);
}

.sidebar-header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
  background: var(--color-bg-subtle, #fafbfc);
}

.sidebar-header-title {
  font-size: 14px;
  font-weight: 600;
}

.sidebar-close {
  display: none;
  color: var(--muted);
}

.sidebar-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

.side-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.side-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.side-title .anticon {
  color: var(--primary);
}

.side-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.side-title-row .side-title {
  margin: 0;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.side-label {
  font-size: 13px;
  color: var(--muted);
}

.side-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-tertiary, #9ca3af);
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}

.field-tip {
  margin-left: 4px;
  color: var(--color-text-tertiary, #9ca3af);
}

.field-select {
  width: 100%;
}

.schedule-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
}

.schedule-clear {
  margin-left: auto;
  color: #b45309;
  text-decoration: underline;
  cursor: pointer;
  flex: none;
}

.section-divider {
  margin: 16px 0;
}

.cover-remove {
  font-size: 12px;
}

.cover-preview {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg);
  border: 1px solid var(--border);
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.cover-preview:hover .cover-overlay {
  opacity: 1;
}

.cover-empty {
  height: 72px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px;
  background: var(--color-bg-subtle, #fafbfc);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.stat-num {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

.stat-name {
  font-size: 12px;
  color: var(--muted);
}

/* ===== 版本历史 ===== */
.version-item {
  padding-bottom: 12px;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.version-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 360px;
}

.version-meta {
  font-size: 12px;
  color: var(--muted);
}

.version-summary {
  margin: 8px 0 4px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-secondary, #4b5563);
  background: var(--color-bg-subtle, #f9fafb);
  border-radius: 6px;
  border-left: 3px solid #d1d5db;
}

.version-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.version-preview h3 {
  margin: 0 0 8px;
  color: var(--text);
}

.version-preview-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--muted);
}

/* ===== 预览弹窗 ===== */
.preview-article {
  max-height: 70vh;
  overflow-y: auto;
}

.preview-cover {
  width: 100%;
  max-height: 280px;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 16px;
}

.preview-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-title {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--text);
}

.preview-meta {
  font-size: 14px;
  color: var(--muted);
}

.preview-content {
  font-size: 15px;
  line-height: 1.8;
}

/* ===== 响应式 ===== */
@media (max-width: 1280px) {
  .editor-sidebar {
    width: 300px;
  }

  .header-stats {
    display: none;
  }
}

@media (max-width: 1100px) {
  .sidebar-toggle-btn {
    display: inline-flex;
  }

  .editor-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 340px;
    max-width: 92vw;
    z-index: 120;
    transform: translateX(100%);
    transition: transform 0.25s ease;
  }

  .editor-sidebar.open {
    transform: translateX(0);
  }

  .sidebar-mask {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
  }

  .editor-sidebar.open .sidebar-mask {
    opacity: 1;
    pointer-events: auto;
  }

  .sidebar-panel {
    position: relative;
    z-index: 1;
    border-radius: 0;
    border-width: 0 0 0 1px;
  }

  .sidebar-close {
    display: inline-flex;
  }
}

@media (max-width: 720px) {
  .editor-header {
    padding: 0 10px;
    gap: 8px;
  }

  .editor-body {
    padding: 10px;
    gap: 0;
  }

  .header-right .action-text {
    display: none;
  }

  .action-divider {
    display: none;
  }

  .page-title {
    font-size: 14px;
  }
}
</style>
