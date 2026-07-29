<script setup lang="ts">
import AiAssistant from '@/components/admin/AiAssistant.vue'
import CoverGenerator from '@/components/admin/CoverGenerator.vue'
import {useArticleStore} from '@/stores/article'
import api from '@/utils/api'
import {
  ArrowLeftOutlined,
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
  ThunderboltOutlined,
} from '@ant-design/icons-vue'
import {Emoji} from '@vavt/v3-extension'
import '@vavt/v3-extension/lib/asset/Emoji.css'
import {MdEditor, MdPreview} from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import 'md-editor-v3/lib/preview.css'
import {message, Modal} from 'ant-design-vue'
import {computed, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'

const router = useRouter()
const route = useRoute()
const articleStore = useArticleStore()

const isEdit = computed(() => !!route.params.id)

const title = ref('')
const content = ref('')
const summary = ref('')
const categoryId = ref<string | null>(null)
const tagIds = ref<string[]>([])
const cover = ref('')
const status = ref<'draft' | 'published'>('draft')
const scheduledAt = ref<string | null>(null)
const summaryLoading = ref(false)
const catalog = ref<any[]>([])
const lastSavedAt = ref<string | null>(null)
const saveLoading = ref(false)
const aiResult = ref('')
const showCoverModal = ref(false)
const showMetaDrawer = ref(false)
const showAiDrawer = ref(false)
const showVersionDrawer = ref(false)
const versions = ref<any[]>([])
const versionsLoading = ref(false)
const versionPreview = ref<any | null>(null)
const versionPreviewLoading = ref(false)
const showVersionPreviewModal = ref(false)

const categories = ref<Array<{ id: string; name: string }>>([])
const tags = ref<Array<{ id: string; name: string }>>([])

const mdToolbars: any[] = [
  'bold',
  'italic',
  'strikeThrough',
  'title',
  '-',
  'quote',
  'code',
  'link',
  'image',
  'table',
  '-',
  'unorderedList',
  'orderedList',
  '-',
  0,
  '-',
  '=',
  'fullscreen',
  'pageFullscreen',
  'preview',
  'previewOnly',
  'codeEditor'
]

const wordCount = computed(() => {
  const text = content.value || ''
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const words = text.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(Boolean).length
  return cjk + words
})

const readingTime = computed(() => {
  const minutes = Math.ceil(wordCount.value / 300)
  return minutes < 1 ? '< 1' : String(minutes)
})

onMounted(async () => {
  await loadCategories()
  await loadTags()

  if (isEdit.value) {
    await loadArticle()
  }
})

async function loadCategories() {
  try {
    const res: any = await api.get('/categories', {params: {pageSize: 100}})
    categories.value = res.data?.rows || res.data?.list || res.data || []
  } catch {
    categories.value = []
  }
}

async function loadTags() {
  try {
    const res: any = await api.get('/tags', {params: {pageSize: 1000}})
    const data = res.data || res
    tags.value = data.list || data.rows || data || []
  } catch {
    tags.value = []
  }
}

async function loadArticle() {
  const id = route.params.id as string
  const article = await articleStore.fetchArticle(id)
  if (article) {
    title.value = article.title
    summary.value = article.summary || ''
    cover.value = article.cover || ''
    categoryId.value = article.category_id
    tagIds.value = (article.tags || []).map((t: any) => t.id)
    status.value = article.status
    catalog.value = (article as any).catalog || []
    content.value = article.content || ''
    // P4-2: 加载定时发布时间
    if ((article as any).scheduled_at) {
      const d = new Date((article as any).scheduled_at)
      const pad = (n: number) => String(n).padStart(2, '0')
      scheduledAt.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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

function onGetCatalog(list: any[]) {
  catalog.value = list
}

// 导入 Markdown 文件
const importMdInput = ref<HTMLInputElement | null>(null)

function handleImportMdClick() {
  importMdInput.value?.click()
}

async function handleImportMdChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 校验文件类型
  const isMd = /\.(md|markdown|mdx)$/i.test(file.name) || file.type === 'text/markdown'
  if (!isMd) {
    message.error('请选择 Markdown 文件（.md / .markdown）')
    target.value = ''
    return
  }

  // 校验文件大小（10MB）
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

    // 若编辑器已有内容，询问是覆盖还是追加
    if (content.value.trim()) {
      Modal.confirm({
        title: '导入 Markdown',
        content: '编辑器已有内容，请选择导入方式',
        okText: '覆盖',
        cancelText: '追加',
        onOk: () => {
          content.value = text
          // 若标题为空，尝试从内容提取一级标题
          if (!title.value.trim()) {
            const m = text.match(/^#\s+(.+?)\s*#*\s*$/m)
            if (m) title.value = m[1].replace(/[`*_~]/g, '').trim()
          }
          message.success(`已导入 ${file.name}`)
        },
        onCancel: () => {
          content.value = content.value + '\n\n' + text
          message.success(`已追加 ${file.name}`)
        }
      })
    } else {
      content.value = text
      // 若标题为空，尝试从内容提取一级标题
      if (!title.value.trim()) {
        const m = text.match(/^#\s+(.+?)\s*#*\s*$/m)
        if (m) title.value = m[1].replace(/[`*_~]/g, '').trim()
      }
      message.success(`已导入 ${file.name}`)
    }
  } catch {
    message.error('读取文件失败')
  } finally {
    target.value = ''
  }
}

async function handleSave(draft: boolean = true) {
  saveLoading.value = true
  const payload: any = {
    title: title.value,
    content: content.value,
    summary: summary.value,
    cover: cover.value,
    category_id: categoryId.value,
    tags: tagIds.value
        .map(id => {
          const tag = tags.value.find(t => t.id === id)
          return tag ? tag.name : ''
        })
        .filter(Boolean),
    status: (draft ? 'draft' : 'published') as 'draft' | 'published',
    content_type: 'markdown',
    catalog: catalog.value
  }
  // P4-2: 定时发布
  if (draft && scheduledAt.value) {
    payload.scheduled_at = new Date(scheduledAt.value).toISOString()
  } else if (!draft) {
    payload.scheduled_at = null
  }

  try {
    if (isEdit.value) {
      await articleStore.updateArticle(route.params.id as string, payload)
      message.success(draft ? '草稿已保存' : '文章已发布')
    } else {
      const res: any = await articleStore.createArticle(payload)
      message.success(draft ? '草稿已保存' : '文章已发布')
      if (res?.id) {
        await router.replace(`/articles/${res.id}/edit`)
      }
    }
    lastSavedAt.value = new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
  } catch {
    message.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

// P4-2: 草稿预览（弹窗内渲染当前编辑器内容）
const showPreviewModal = ref(false)
function handlePreview() {
  if (!content.value.trim()) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  showPreviewModal.value = true
}

async function handleGenerateSummary() {
  if (!content.value.trim()) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  summaryLoading.value = true
  try {
    const res: any = await api.post('/ai/summary', {content: content.value})
    const data = res.data || res
    summary.value = data.summary || data.content || ''
    if (summary.value) {
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
    const currentIds = new Set(tagIds.value)
    generatedTags.forEach(t => currentIds.add(t.id))
    tagIds.value = Array.from(currentIds)
    message.success(`已自动选中 ${generatedTags.length} 个标签`)
  })
}

function handleInsertAiContent(inserted: string) {
  content.value = inserted
  aiResult.value = ''
}

function handleCoverSelected(url: string) {
  cover.value = url
  showCoverModal.value = false
}

// P4-1: 版本历史
async function openVersionDrawer() {
  if (!isEdit.value) {
    message.warning('新建文章暂无版本历史')
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
    title.value = data.title
    content.value = data.content
    summary.value = data.summary || ''
    cover.value = data.cover || ''
    categoryId.value = data.category_id || null
    if (data.content_type) {
      // content_type 已在文章模型中
    }
    message.success('已恢复到指定版本')
    showVersionDrawer.value = false
    versionPreview.value = null
    showVersionPreviewModal.value = false
    await fetchVersions()
  } catch {
    message.error('恢复版本失败')
  }
}

const filterOption = (input: string, option: { value: string, name: string, key: string }) => {
  return option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0
}
</script>

<template>
  <div class="editor-page">
    <!-- 顶部工具栏 -->
    <header class="editor-header">
      <div class="header-left">
        <a-button class="header-btn" @click="router.back()">
          <ArrowLeftOutlined/>
        </a-button>
        <div class="header-title">
          <EditOutlined class="title-icon"/>
          <span>{{ isEdit ? '编辑文章' : '撰写新文章' }}</span>
        </div>
        <a-tag color="purple" class="mode-tag">Markdown</a-tag>
      </div>

      <div class="header-center">
        <FileTextOutlined class="stat-icon"/>
        <span class="stat-value">{{ wordCount }}</span>
        <span class="stat-label">字</span>
        <span class="stat-divider">·</span>
        <span class="stat-label">预计阅读 {{ readingTime }} 分钟</span>
        <span v-if="lastSavedAt" class="stat-divider">·</span>
        <span v-if="lastSavedAt" class="stat-label">已保存 {{ lastSavedAt }}</span>
      </div>

      <div class="header-right">
        <a-button class="drawer-btn" @click="handleImportMdClick">
          <ImportOutlined/>
          导入
        </a-button>
        <a-button class="drawer-btn" @click="showMetaDrawer = true">
          <MenuOutlined/>
          信息
        </a-button>
        <a-button class="drawer-btn" @click="showAiDrawer = true">
          <RobotOutlined/>
          AI
        </a-button>
        <a-button v-if="isEdit" class="drawer-btn" @click="openVersionDrawer">
          <HistoryOutlined/>
          历史
        </a-button>
        <a-button v-if="isEdit" class="drawer-btn" @click="handlePreview" :loading="saveLoading">
          <EyeOutlined/>
          预览
        </a-button>
        <a-button :loading="saveLoading" @click="handleSave(true)">
          <SaveOutlined/>
          保存草稿
        </a-button>
        <a-button
            type="primary"
            :loading="saveLoading"
            class="publish-btn"
            @click="handleSave(false)"
        >
          <SendOutlined/>
          {{ isEdit && status === 'published' ? '更新' : '发布' }}
        </a-button>
      </div>
    </header>

    <!-- 封面弹窗 -->
    <a-modal v-model:open="showCoverModal" title="设置封面图片" width="520px" :footer="null">
      <CoverGenerator
          :current-cover="cover"
          @selected="handleCoverSelected"
          @cancel="showCoverModal = false"
      />
    </a-modal>

    <!-- 主体：全宽编辑器 + 可展开侧边抽屉（push 模式） -->
    <div
        class="editor-body"
        :class="{
        'is-pushed-right': showMetaDrawer,
        'is-pushed-left': showAiDrawer
      }"
    >
      <main class="editor-main">
        <MdEditor
            v-model="content"
            language="zh-CN"
            :preview="true"
            previewTheme="vuepress"
            :show-code-row-number="true"
            :footers="['markdownTotal']"
            :toolbars="mdToolbars"
            :on-upload-img="handleMdUploadImg"
            @onGetCatalog="onGetCatalog"
            class="md-editor"
        >
          <template #defToolbars>
            <Emoji title="表情"/>
          </template>
        </MdEditor>
      </main>
    </div>

    <!-- 文章信息抽屉 -->
    <a-drawer
        v-model:open="showMetaDrawer"
        title="文章信息"
        placement="left"
        width="340"
        :mask="false"
        root-class-name="editor-side-drawer"
    >
      <div class="drawer-content">
        <div class="panel-section">
          <label class="field-label">文章标题</label>
          <a-input v-model:value="title" placeholder="输入一个简洁有力的标题..." size="large"/>
        </div>
        <div class="panel-section">
          <label class="field-label">分类</label>
          <a-select v-model:value="categoryId" placeholder="选择分类" allow-clear class="field-select">
            <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </a-select-option>
          </a-select>
        </div>
        <div class="panel-section">
          <label class="field-label">标签</label>
          <a-select
              v-model:value="tagIds"
              mode="multiple"
              placeholder="选择标签"
              allow-clear
              show-search
              :filter-option="filterOption"
              class="field-select"
          >
            <a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id" :name="tag.name">
              {{ tag.name }}
            </a-select-option>
          </a-select>
        </div>
        <div class="panel-section">
          <div class="label-row">
            <label class="field-label">摘要</label>
            <a-button type="dashed" size="small" :loading="summaryLoading" @click="handleGenerateSummary">
              <ThunderboltOutlined/>
              生成
            </a-button>
          </div>
          <a-textarea v-model:value="summary" placeholder="文章摘要会在列表和 SEO 中展示..." :rows="5"/>
        </div>
        <div class="panel-section">
          <label class="field-label">封面</label>
          <div v-if="cover" class="cover-preview">
            <img :src="cover" alt="封面预览"/>
            <div class="cover-overlay">
              <a-button type="primary" size="small" @click="showCoverModal = true">更换</a-button>
            </div>
          </div>
          <a-button v-else type="dashed" block @click="showCoverModal = true">
            <PictureOutlined/>
            设置封面
          </a-button>
        </div>
        <!-- P4-2: 定时发布 -->
        <div class="panel-section">
          <label class="field-label">
            定时发布
            <a-tooltip title="设置后保存草稿，到点会自动发布。直接点发布会立即发布并取消定时。">
              <InfoCircleOutlined style="margin-left: 4px; color: #9ca3af"/>
            </a-tooltip>
          </label>
          <a-date-picker
              v-model:value="scheduledAt"
              show-time
              format="YYYY-MM-DD HH:mm"
              placeholder="选择定时发布时间"
              style="width: 100%"
              :disabled="status === 'published'"
          />
          <div v-if="scheduledAt" class="schedule-hint">
            将在 {{ new Date(scheduledAt).toLocaleString('zh-CN') }} 自动发布
          </div>
        </div>
      </div>
    </a-drawer>

    <!-- AI 助手抽屉 -->
    <a-drawer
        v-model:open="showAiDrawer"
        title="AI 助手"
        placement="right"
        width="360"
        :mask="false"
        root-class-name="editor-side-drawer"
    >
      <div class="drawer-content">
        <AiAssistant
            :editor-content="content"
            content-type="markdown"
            @result="handleAiResult"
            @insert="handleInsertAiContent"
            @tags-generated="handleTagsGenerated"
        />
      </div>
    </a-drawer>

    <!-- P4-1: 版本历史抽屉 -->
    <a-drawer
        v-model:open="showVersionDrawer"
        title="版本历史"
        placement="right"
        width="560"
        :mask="true"
    >
      <div class="version-drawer">
        <a-alert
            message="每次修改文章内容或标题时会自动保存一个版本，最多保留 10 个。"
            type="info"
            show-icon
            style="margin-bottom: 16px"
        />

        <a-spin :spinning="versionsLoading">
          <a-empty v-if="!versionsLoading && versions.length === 0" description="暂无版本历史" />
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
                  <a-button size="small" @click="previewVersion(v.id)" :loading="versionPreviewLoading">
                    预览
                  </a-button>
                  <a-popconfirm
                      title="确定恢复到此版本？当前内容会自动保存为新版本。"
                      @confirm="restoreVersion(v.id)"
                      ok-text="恢复"
                      cancel-text="取消"
                  >
                    <a-button size="small" type="primary" ghost>恢复</a-button>
                  </a-popconfirm>
                </div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-spin>

        <!-- 版本预览 -->
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
            <a-divider />
            <pre class="version-preview-content">{{ versionPreview.content }}</pre>
          </div>
        </a-modal>
      </div>
    </a-drawer>

    <!-- P4-2: 草稿预览弹窗 -->
    <a-modal
        v-model:open="showPreviewModal"
        :title="`预览：${title || '未命名文章'}`"
        width="900px"
        :footer="null"
        class="preview-modal"
    >
      <div class="preview-article">
        <div class="preview-cover" v-if="cover">
          <img :src="cover" alt="封面"/>
        </div>
        <h1 class="preview-title">{{ title || '未命名文章' }}</h1>
        <div class="preview-meta">
          <span>{{ summary || '暂无摘要' }}</span>
        </div>
        <a-divider/>
        <MdPreview
            :modelValue="content"
            :show-code-row-number="false"
            language="zh-CN"
            preview-theme="cyanosis"
            class="preview-content"
        />
      </div>
    </a-modal>

    <!-- 导入 Markdown 文件（隐藏 input） -->
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
  --editor-bg: #F7F5F2;
  --panel-bg: #FFFFFF;
  --ink: #1F2937;
  --muted: #6B7280;
  --accent: #D97706;
  --accent-hover: #B45309;
  --border: #E5E7EB;
  --radius: 12px;

  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--editor-bg);
  color: var(--ink);
}

/* 顶部工具栏 */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: var(--panel-bg);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 16px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.title-icon {
  color: var(--accent);
}

.mode-tag {
  font-size: 12px;
  border-radius: 999px;
  padding: 2px 10px;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
  white-space: nowrap;
}

.stat-icon {
  color: var(--accent);
}

.stat-value {
  color: var(--ink);
  font-weight: 600;
}

.stat-divider {
  opacity: 0.5;
}

.publish-btn {
  background: var(--accent);
  border-color: var(--accent);
}

.publish-btn:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

:global(.editor-side-drawer .ant-drawer-body) {
  padding: 0;
}

:global(.editor-side-drawer .ant-drawer-header) {
  border-bottom: 1px solid #E5E7EB;
}

.drawer-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 主体布局 */
.editor-body {
  flex: 1;
  min-height: 0;
  padding: 24px 32px 32px;
  display: flex;
  justify-content: center;
  width: 100%;
  transition: margin 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.editor-body.is-pushed-right {
  margin-left: 340px;
  width: calc(100% - 340px);
}

.editor-body.is-pushed-left {
  margin-right: 360px;
  width: calc(100% - 360px);
}

.editor-body.is-pushed-right.is-pushed-left {
  margin-left: 340px;
  margin-right: 360px;
  width: calc(100% - 340px - 360px);
}

/* 编辑器主区域：像一张纸铺在桌面上 */
.editor-main {
  width: 100%;
  background: var(--panel-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.md-editor {
  flex: 1;
  height: 100% !important;
}

.md-editor :deep(.md-editor-container) {
  border: none;
}

/* 抽屉内内容 */
.drawer-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-select {
  width: 100%;
}

.cover-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background: var(--editor-bg);
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

/* 响应式 */
@media (max-width: 1200px) {
  .editor-body {
    padding: 20px 24px 28px;
  }
}

@media (max-width: 768px) {
  .editor-header {
    padding: 0 12px;
  }

  .header-center {
    display: none;
  }

  .editor-body {
    padding: 12px;
  }

  .header-right .ant-btn > span:last-child {
    display: none;
  }
}

/* P4-1: 版本历史样式 */
.version-drawer {
  padding-bottom: 24px;
}

/* P4-2: 定时发布提示 */
.schedule-hint {
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: #d97706;
  background: #fef3c7;
  border-radius: 4px;
  border-left: 3px solid #f59e0b;
}

/* P4-2: 预览弹窗样式 */
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
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px;
  line-height: 1.4;
}

.preview-meta {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.preview-content {
  font-size: 15px;
  line-height: 1.8;
}

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
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 360px;
}

.version-meta {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.version-summary {
  font-size: 12px;
  color: #4b5563;
  margin: 6px 0;
  padding: 6px 10px;
  background: #f9fafb;
  border-radius: 4px;
  border-left: 3px solid #d1d5db;
}

.version-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.version-preview h3 {
  margin: 0 0 8px;
  color: #1f2937;
}

.version-preview-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.version-preview-content {
  max-height: 500px;
  overflow: auto;
  background: #f9fafb;
  padding: 16px;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #374151;
}
</style>
