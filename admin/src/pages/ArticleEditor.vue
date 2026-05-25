<script setup lang="ts">
import AiAssistant from '@/components/admin/AiAssistant.vue'
import CoverGenerator from '@/components/admin/CoverGenerator.vue'
import {useArticleStore} from '@/stores/article'
import api from '@/utils/api'
import {
  ArrowLeftOutlined,
  SnippetsOutlined,
  EyeOutlined,
  PictureOutlined,
  SaveOutlined,
  SendOutlined,
  ThunderboltOutlined,
  SwapOutlined
} from '@ant-design/icons-vue'
import type {IDomEditor, IEditorConfig, IToolbarConfig} from '@wangeditor/editor'
import {Editor, Toolbar} from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import {MdEditor} from 'md-editor-v3'
import {Emoji} from '@vavt/v3-extension'
import '@vavt/v3-extension/lib/asset/Emoji.css'
import 'md-editor-v3/lib/style.css'
import {message} from 'ant-design-vue'
import {computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'

const router = useRouter()
const route = useRoute()
const articleStore = useArticleStore()

const isEdit = computed(() => !!route.params.id)
const editorId = computed(() => (isEdit.value ? (route.params.id as string) : 'create'))

const title = ref('')
const valueHtml = ref('')
const valueMd = ref('')
const summary = ref('')
const categoryId = ref<string | null>(null)
const tagIds = ref<string[]>([])
const cover = ref('')
const status = ref<'draft' | 'published'>('draft')
const summaryLoading = ref(false)
const editorMode = ref<'html' | 'markdown'>('html')
const content_type = ref<'html' | 'markdown'>('html')
const catalog = ref<any[]>([])

const categories = ref<Array<{ id: string; name: string }>>([])
const tags = ref<Array<{ id: string; name: string }>>([])

// HTML编辑器 (wangeditor)
const editorRef = shallowRef<IDomEditor | null>(null)
const showPreview = ref(false)
const showCoverModal = ref(false)
const coverPreviewVisible = ref(false)
const saveLoading = ref(false)
const aiResult = ref('')

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '开始创作你的文章...',
  autoFocus: false,
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string) => void) {
        const formData = new FormData()
        formData.append('file', file)
        try {
          const res: any = await api.post('/upload', formData, {
            headers: {'Content-Type': 'multipart/form-data'}
          })
          const url = res.data?.url || res.url
          if (url) insertFn(url)
        } catch {
          message.error('图片上传失败')
        }
      }
    },
    uploadVideo: {
      async customUpload(file: File, insertFn: (url: string) => void) {
        const formData = new FormData()
        formData.append('file', file)
        try {
          const res: any = await api.post('/upload', formData, {
            headers: {'Content-Type': 'multipart/form-data'}
          })
          const url = res.data?.url || res.url
          if (url) insertFn(url)
        } catch {
          message.error('视频上传失败')
        }
      }
    }
  }
}

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['fullScreen']
}

let mode: 'default' | 'simple' = 'default'

// md-editor-v3 工具栏配置
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

// md-editor-v3 图片上传
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
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const url = res.data?.url || res.url
        return { url: typeof url === 'string' ? url : '', alt: file.name, title: file.name }
      } catch {
        message.error('图片上传失败')
        return { url: '', alt: file.name, title: `上传失败: ${file.name}` }
      }
    })
  )
  callback(results.filter(r => r.url))
}

function onGetCatalog(list: any[]) {
  catalog.value = list
}

onMounted(async () => {
  await loadCategories()
  await loadTags()

  if (isEdit.value) {
    await loadArticle()
  }
})

onBeforeUnmount(() => {
  editorRef.value?.destroy()
})

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor
}

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
    const ct = (article as any).content_type || 'html'
    content_type.value = ct
    editorMode.value = ct
    catalog.value = (article as any).catalog || []
    const content = article.content || ''
    await nextTick(() => {
      if (ct === 'markdown') {
        valueMd.value = content
      } else {
        if (editorRef.value) {
          editorRef.value.setHtml(content)
        }
        valueHtml.value = content
      }
    })
  }
}

function getEditorContent(): string {
  if (editorMode.value === 'markdown') {
    return valueMd.value
  }
  return editorRef.value?.getHtml() || ''
}

// 切换编辑器模式
function handleToggleEditorMode() {
  // 获取当前内容
  const currentContent = getEditorContent()
  if (editorMode.value === 'html') {
    // 切换到 markdown
    editorMode.value = 'markdown'
    // 将当前HTML内容作为初始markdown内容
    if (currentContent && !valueMd.value) {
      valueMd.value = currentContent
    }
  } else {
    // 切换到 HTML
    editorMode.value = 'html'
    // 将当前markdown内容作为初始HTML内容
    if (currentContent && !valueHtml.value) {
      valueHtml.value = currentContent
      nextTick(() => {
        if (editorRef.value) {
          editorRef.value.setHtml(currentContent)
        }
      })
    }
  }
  content_type.value = editorMode.value
}

async function handleSave(draft: boolean = true) {
  saveLoading.value = true
  const content = getEditorContent()
  const payload: any = {
    title: title.value,
    content,
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
    content_type: content_type.value,
    catalog: editorMode.value === 'markdown' ? catalog.value : null
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
  } catch {
    message.error('保存失败')
  } finally {
    await loadArticle()
    saveLoading.value = false
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

function handleInsertAiContent(content: string) {
  if (editorMode.value === 'markdown') {
    valueMd.value = content
  } else if (editorRef.value) {
    editorRef.value.focus()
    editorRef.value.setHtml(content)
    valueHtml.value = content
  }
  aiResult.value = ''
}

function handleCoverSelected(url: string) {
  cover.value = url
  showCoverModal.value = false
}

function handleToggleMode() {
  mode = mode === 'default' ? 'simple' : 'default'
}

async function handleGenerateSummary() {
  const content = getEditorContent()
  if (!content.trim()) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  summaryLoading.value = true
  try {
    const res: any = await api.post('/ai/summary', {content})
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

const filterOption = (input: string, option: { value: string, name: string, key: string }) => {
  return option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 监听编辑器内容变化（传递当前内容类型给AI助手）
const currentEditorContent = computed(() => {
  return editorMode.value === 'markdown' ? valueMd.value : valueHtml.value
})
</script>

<template>
  <div class="article-editor">
    <div class="page-header">
      <a-space>
          <a-button @click="router.back()">
            <template #icon>
              <ArrowLeftOutlined/>
            </template>
          </a-button>
          <h2 style="margin-top: 10px">{{ isEdit ? '文章编辑' : '发布文章' }}</h2>
          <a-tag :color="editorMode === 'markdown' ? 'purple' : 'blue'">
            {{ editorMode === 'markdown' ? 'Markdown' : 'HTML' }}
          </a-tag>
      </a-space>
      <a-space>
        <a-button @click="handleToggleEditorMode" v-if="!isEdit">
          <template #icon>
            <SwapOutlined />
          </template>
          切换到{{ editorMode === 'markdown' ? 'HTML' : 'Markdown' }}编辑器
        </a-button>
        <a-button @click="showCoverModal = true">
          <template #icon>
            <PictureOutlined/>
          </template>
          {{ cover ? '更换封面' : '设置封面' }}
        </a-button>
        <a-button @click="showPreview = !showPreview">
          <template #icon>
            <EyeOutlined/>
          </template>
          {{ showPreview ? '编辑' : '预览' }}
        </a-button>
        <a-button @click="handleSave(true)" :loading="saveLoading">
          <template #icon>
            <SaveOutlined/>
          </template>
          保存草稿
        </a-button>
        <a-button type="primary"
                  v-if="isEdit && status === 'published'"
                  style="background: #E6A23C"
                  @click="handleSave(false)" :loading="saveLoading">
          <template #icon>
            <SnippetsOutlined />
          </template>
          保存
        </a-button>
        <a-button type="primary"
                  v-else
                  @click="handleSave(false)" :loading="saveLoading">
          <template #icon>
            <SendOutlined/>
          </template>
          发布
        </a-button>
      </a-space>
    </div>

    <a-modal v-model:open="showCoverModal" title="设置封面图片" width="520px" :footer="null">
      <CoverGenerator :current-cover="cover" @selected="handleCoverSelected" @cancel="showCoverModal = false"/>
    </a-modal>

    <a-row :gutter="16">
      <a-col :xs="24" :lg="17">
        <div style="margin-bottom: 16px">
          <a-input v-model:value="title" placeholder="输入文章标题..." size="large" :bordered="false"
                   style="font-size: 24px; font-weight: 600; padding: 0"/>
        </div>

        <a-space style="margin-bottom: 16px" size="middle" wrap>
          <a-select v-model:value="categoryId" placeholder="选择分类" style="width: 160px" allow-clear>
            <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </a-select-option>
          </a-select>

          <a-select v-model:value="tagIds" mode="multiple" placeholder="选择标签" style="min-width: 200px" allow-clear
                    show-search
                    :filter-option="filterOption">
            <a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id" :name="tag.name">
              {{ tag.name }}
            </a-select-option>
          </a-select>
        </a-space>

        <div style="margin-bottom: 16px; display: flex; gap: 8px">
          <a-textarea v-model:value="summary" placeholder="文章摘要..." :rows="3" style="flex: 1"/>
          <a-button type="dashed" :loading="summaryLoading" @click="handleGenerateSummary" style="flex-shrink: 0">
            <template #icon>
              <ThunderboltOutlined/>
            </template>
            生成摘要
          </a-button>
        </div>

        <div v-if="cover" style="margin-bottom: 16px">
          <a-image :src="cover" alt="cover"
               style="max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: cover; cursor: pointer"/>
        </div>

        <div v-show="showPreview" class="editor-container" style="min-height: 500px">
          <div v-if="editorMode === 'markdown'" class="markdown-preview" style="min-height: 500px; padding: 16px">
            <!-- Markdown预览: 由 md-editor-v3 的 previewOnly 模式处理 -->
          </div>
          <div v-else class="html-preview" v-html="getEditorContent()" style="min-height: 500px"/>
        </div>

        <!-- HTML 编辑器 (wangeditor) -->
        <div v-show="!showPreview && editorMode === 'html'" class="editor-container">
          <Toolbar :editor="editorRef" :default-config="toolbarConfig" :mode="mode"
                   style="border-bottom: 1px solid #d9d9d9"/>
          <Editor :default-config="editorConfig" :mode="mode" style="height: 500px; overflow-y: hidden"
                  @onCreated="handleCreated"/>
        </div>

        <!-- Markdown 编辑器 (md-editor-v3) -->
        <div v-show="!showPreview && editorMode === 'markdown'" class="editor-container md-editor-wrapper">
          <MdEditor
            v-model="valueMd"
            language="zh-CN"
            :preview="false"
            :show-code-row-number="true"
            placeholder="开始创作你的文章..."
            :footers="['markdownTotal']"
            :on-upload-img="handleMdUploadImg"
            @onGetCatalog="onGetCatalog"
            style="height: 600px"
          >
            <template #defToolbars>
              <Emoji title="表情" />
            </template>
          </MdEditor>
        </div>
      </a-col>

      <a-col :xs="24" :lg="7">
        <AiAssistant
          :editor-content="currentEditorContent"
          :content-type="content_type"
          @result="handleAiResult"
          @insert="handleInsertAiContent"
          @tags-generated="handleTagsGenerated"
        />
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.article-editor {
  height: 100%;
}

.md-editor-wrapper {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.markdown-preview {
  padding: 16px;
  background: var(--color-card, #fff);
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}
</style>