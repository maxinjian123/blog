<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/utils/api'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  GithubOutlined,
  FileMarkdownOutlined,
  EyeOutlined,
  ImportOutlined,
  ArrowLeftOutlined,
  StarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileSearchOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { marked } from 'marked'

// 配置 marked：启用 GitHub 风格、换行转 <br>
marked.setOptions({
  gfm: true,
  breaks: true
})

// 步骤：search -> files -> result
type Step = 'search' | 'files' | 'result'

// 搜索模式：repo（搜索仓库）/ code（搜索文章内容）
type SearchMode = 'repo' | 'code'

interface Repo {
  id: number
  name: string
  full_name: string
  owner: string
  description: string
  url: string
  stars: number
  forks: number
  language: string
  default_branch: string
  topics: string[]
  updated_at: string
}

interface MdFile {
  path: string
  name: string
  sha: string
  size: number
}

// 文章搜索结果项（search/code 返回）
interface CodeResult {
  name: string
  path: string
  sha: string
  html_url: string
  owner: string
  repo: string
  repo_full_name: string
  repo_url: string
  repo_stars: number
  repo_description: string
}

interface Category {
  id: string
  name: string
  slug: string
}

const step = ref<Step>('search')
const searchMode = ref<SearchMode>('code')
const loading = ref(false)
const importing = ref(false)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  language: 'markdown',
  repo: '',
  user: ''
})

// 仓库搜索结果
const repos = ref<Repo[]>([])
const repoTotal = ref(0)
const repoPage = reactive({ current: 1, pageSize: 10 })

// 文章搜索结果
const codeResults = ref<CodeResult[]>([])
const codeTotal = ref(0)
const codePage = reactive({ current: 1, pageSize: 20 })
const selectedCodeKeys = ref<string[]>([])

// 当前选中的仓库
const currentRepo = ref<Repo | null>(null)

// 文件列表
const files = ref<MdFile[]>([])
const selectedFileKeys = ref<string[]>([])
const filesLoading = ref(false)
const currentRef = ref('')

// 预览
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewData = ref<{ name: string; path: string; content: string; truncated: boolean } | null>(null)
// 预览所需上下文（owner/repo/ref）
const previewCtx = ref<{ owner: string; repo: string; ref?: string } | null>(null)
// 预览渲染后的 HTML
const previewHtml = computed(() => {
  if (!previewData.value?.content) return ''
  try {
    return marked.parse(previewData.value.content) as string
  } catch {
    return `<pre>${previewData.value.content}</pre>`
  }
})

// 导入配置
const importConfig = reactive({
  autoSummary: true,
  autoTags: true,
  category_id: '' as string
})
const categories = ref<Category[]>([])

// 导入结果
const importResult = ref<{
  imported: number
  failed: number
  results: any[]
  failed_list: any[]
} | null>(null)

const repoColumns = [
  { title: '仓库', dataIndex: 'full_name', key: 'full_name', ellipsis: true },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '语言', dataIndex: 'language', key: 'language', width: 100 },
  { title: 'Stars', dataIndex: 'stars', key: 'stars', width: 90 },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 120 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' as const }
]

const codeColumns = [
  { title: '文件', key: 'name', ellipsis: true },
  { title: '所在仓库', key: 'repo_full_name', ellipsis: true },
  { title: '仓库描述', key: 'repo_description', ellipsis: true },
  { title: 'Stars', key: 'repo_stars', width: 90 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const }
]

const fileColumns = [
  { title: '文件路径', dataIndex: 'path', key: 'path', ellipsis: true },
  { title: '大小', dataIndex: 'size', key: 'size', width: 100 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const }
]

const codeRowSelection = computed(() => ({
  selectedRowKeys: selectedCodeKeys.value,
  onChange: (keys: string[]) => {
    selectedCodeKeys.value = keys
  }
}))

const fileRowSelection = computed(() => ({
  selectedRowKeys: selectedFileKeys.value,
  onChange: (keys: string[]) => {
    selectedFileKeys.value = keys
  }
}))

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatDate(date: string): string {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

// 切换搜索模式时清空结果
function handleModeChange() {
  repos.value = []
  repoTotal.value = 0
  codeResults.value = []
  codeTotal.value = 0
  selectedCodeKeys.value = []
}

// 统一搜索入口
async function handleSearch() {
  if (!searchForm.keyword.trim()) {
    message.warning('请输入搜索关键词')
    return
  }
  if (searchMode.value === 'repo') {
    await searchRepos()
  } else {
    await searchCode()
  }
}

// 搜索仓库
async function searchRepos() {
  loading.value = true
  try {
    const res: any = await api.get('/crawler/search', {
      params: {
        keyword: searchForm.keyword,
        language: searchForm.language || undefined,
        page: repoPage.current,
        pageSize: repoPage.pageSize
      }
    })
    repos.value = res.data?.list || []
    repoTotal.value = res.data?.total || 0
  } catch {
    // 错误已由拦截器处理
  } finally {
    loading.value = false
  }
}

// 搜索文章内容
async function searchCode() {
  loading.value = true
  try {
    const res: any = await api.get('/crawler/search-code', {
      params: {
        keyword: searchForm.keyword,
        repo: searchForm.repo || undefined,
        user: searchForm.user || undefined,
        page: codePage.current,
        pageSize: codePage.pageSize
      }
    })
    codeResults.value = res.data?.list || []
    codeTotal.value = res.data?.total || 0
    selectedCodeKeys.value = []
  } catch {
    // 错误已由拦截器处理
  } finally {
    loading.value = false
  }
}

function handleRepoPageChange(page: number, pageSize: number) {
  repoPage.current = page
  repoPage.pageSize = pageSize
  searchRepos()
}

function handleCodePageChange(page: number, pageSize: number) {
  codePage.current = page
  codePage.pageSize = pageSize
  searchCode()
}

// 选择仓库，进入文件列表
async function handleSelectRepo(repo: Repo) {
  currentRepo.value = repo
  step.value = 'files'
  files.value = []
  selectedFileKeys.value = []
  await fetchFiles()
}

async function fetchFiles() {
  if (!currentRepo.value) return
  filesLoading.value = true
  try {
    const res: any = await api.get(`/crawler/repos/${currentRepo.value.owner}/${currentRepo.value.name}/files`)
    files.value = res.data?.files || []
    currentRef.value = res.data?.ref || ''
  } catch {
    // 错误已由拦截器处理
  } finally {
    filesLoading.value = false
  }
}

// 预览文件（仓库模式）
async function handlePreviewFile(file: MdFile) {
  if (!currentRepo.value) return
  await openPreview({
    owner: currentRepo.value.owner,
    repo: currentRepo.value.name,
    path: file.path,
    ref: currentRef.value
  })
}

// 预览文件（文章搜索模式）
async function handlePreviewCode(item: CodeResult) {
  await openPreview({
    owner: item.owner,
    repo: item.repo,
    path: item.path
  })
}

async function openPreview(ctx: { owner: string; repo: string; path: string; ref?: string }) {
  previewVisible.value = true
  previewLoading.value = true
  previewData.value = null
  previewCtx.value = { owner: ctx.owner, repo: ctx.repo, ref: ctx.ref }
  try {
    const res: any = await api.post('/crawler/preview', {
      owner: ctx.owner,
      repo: ctx.repo,
      path: ctx.path,
      ref: ctx.ref
    })
    previewData.value = res.data
  } catch {
    // 错误已由拦截器处理
  } finally {
    previewLoading.value = false
  }
}

// 返回搜索
function backToSearch() {
  step.value = 'search'
  currentRepo.value = null
  files.value = []
  selectedFileKeys.value = []
}

// 导入（仓库模式：选中的文件路径）
async function handleImportFiles() {
  if (selectedFileKeys.value.length === 0 || !currentRepo.value) return
  const items = selectedFileKeys.value.map(path => ({
    owner: currentRepo.value!.owner,
    repo: currentRepo.value!.name,
    path,
    ref: currentRef.value
  }))
  await doImport(items)
}

// 导入（文章模式：选中的文章项）
async function handleImportCode() {
  if (selectedCodeKeys.value.length === 0) return
  const selected = codeResults.value.filter(c => selectedCodeKeys.value.includes(c.path))
  const items = selected.map(c => ({
    owner: c.owner,
    repo: c.repo,
    path: c.path
  }))
  await doImport(items)
}

async function doImport(items: any[]) {
  if (items.length === 0) {
    message.warning('请至少选择一个文件')
    return
  }
  importing.value = true
  try {
    const res: any = await api.post('/crawler/import', {
      items,
      autoSummary: importConfig.autoSummary,
      autoTags: importConfig.autoTags,
      category_id: importConfig.category_id || undefined
    })
    importResult.value = res.data
    step.value = 'result'
    message.success(res.message || '导入完成')
  } catch {
    // 错误已由拦截器处理
  } finally {
    importing.value = false
  }
}

// 加载分类列表
async function fetchCategories() {
  try {
    const res: any = await api.get('/categories')
    categories.value = res.data || res || []
  } catch {
    // 忽略
  }
}

function backToFiles() {
  step.value = 'files'
  importResult.value = null
}

function backToSearchFromResult() {
  step.value = 'search'
  importResult.value = null
  currentRepo.value = null
  handleSearch()
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>GitHub 文章爬虫</h2>
      <p class="page-desc">从 GitHub 搜索并导入 Markdown 文章，自动生成摘要与标签</p>
    </div>

    <!-- 步骤指示（仓库模式三步，文章模式两步） -->
    <a-steps
      :current="step === 'search' ? 0 : step === 'files' ? 1 : (searchMode === 'code' ? 1 : 2)"
      size="small"
      style="margin-bottom: 24px"
    >
      <a-step title="搜索" />
      <a-step v-if="searchMode === 'repo'" title="选择文件" />
      <a-step title="导入结果" />
    </a-steps>

    <!-- Step 1: 搜索 -->
    <div v-if="step === 'search'">
      <a-card>
        <!-- 搜索模式切换 -->
        <a-radio-group v-model:value="searchMode" style="margin-bottom: 16px" @change="handleModeChange">
          <a-radio-button value="code">
            <file-search-outlined />
            搜索文章内容
          </a-radio-button>
          <a-radio-button value="repo">
            <github-outlined />
            搜索仓库
          </a-radio-button>
        </a-radio-group>

        <a-alert
          v-if="searchMode === 'code'"
          message="直接在 GitHub 全站 Markdown 文件内容中搜索关键词，结果更精准；可在高级选项中限定仓库或用户"
          type="info"
          show-icon
          style="margin-bottom: 16px"
        />
        <a-alert
          v-else
          message="按仓库名/描述搜索，找到相关仓库后再从中选择 Markdown 文件导入"
          type="info"
          show-icon
          style="margin-bottom: 16px"
        />

        <a-form layout="inline" @submit.prevent="handleSearch">
          <a-form-item label="关键词">
            <a-input
              v-model:value="searchForm.keyword"
              :placeholder="searchMode === 'code' ? '搜索文章内容，如：React Hooks 原理' : '搜索仓库主题，如：vue3 教程'"
              style="width: 360px"
              allow-clear
              @pressEnter="handleSearch"
            />
          </a-form-item>
          <template v-if="searchMode === 'code'">
            <a-form-item label="限定仓库">
              <a-input
                v-model:value="searchForm.repo"
                placeholder="owner/repo（可选）"
                style="width: 200px"
                allow-clear
              />
            </a-form-item>
            <a-form-item label="限定用户">
              <a-input
                v-model:value="searchForm.user"
                placeholder="用户名（可选）"
                style="width: 160px"
                allow-clear
              />
            </a-form-item>
          </template>
          <template v-else>
            <a-form-item label="语言">
              <a-select v-model:value="searchForm.language" style="width: 140px" allow-clear placeholder="不限">
                <a-select-option value="markdown">Markdown</a-select-option>
                <a-select-option value="javascript">JavaScript</a-select-option>
                <a-select-option value="typescript">TypeScript</a-select-option>
                <a-select-option value="python">Python</a-select-option>
                <a-select-option value="java">Java</a-select-option>
                <a-select-option value="go">Go</a-select-option>
              </a-select>
            </a-form-item>
          </template>
          <a-form-item>
            <a-button type="primary" :loading="loading" @click="handleSearch">
              <search-outlined />
              搜索
            </a-button>
          </a-form-item>
        </a-form>

        <!-- 导入配置（文章模式：紧跟搜索表单，避免被忽略） -->
        <a-divider v-if="searchMode === 'code'" style="margin: 16px 0" />
        <div v-if="searchMode === 'code'" class="import-config-bar">
          <span class="config-label"><import-outlined /> 导入配置：</span>
          <a-form layout="inline" style="flex: 1">
            <a-form-item label="自动摘要">
              <a-switch v-model:checked="importConfig.autoSummary" />
            </a-form-item>
            <a-form-item label="自动标签">
              <a-switch v-model:checked="importConfig.autoTags" />
            </a-form-item>
            <a-form-item label="分类">
              <a-select
                v-model:value="importConfig.category_id"
                style="width: 160px"
                allow-clear
                placeholder="不指定"
              >
                <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
        </div>
      </a-card>

      <!-- 文章搜索结果（code 模式） -->
      <template v-if="searchMode === 'code'">
        <div v-if="codeResults.length || codeTotal" style="margin-top: 16px">
          <div class="list-toolbar">
            <span class="text-muted">共 {{ codeTotal }} 篇文章，已选 {{ selectedCodeKeys.length }} 篇</span>
            <a-button
              type="primary"
              :loading="importing"
              :disabled="selectedCodeKeys.length === 0"
              style="margin-left: 16px"
              @click="handleImportCode"
            >
              <import-outlined />
              导入 {{ selectedCodeKeys.length }} 篇为草稿
            </a-button>
            <span v-if="selectedCodeKeys.length > 0" style="margin-left: 12px; color: rgba(0,0,0,0.45)">
              单次最多 20 篇
            </span>
          </div>
          <a-table
            :columns="codeColumns"
            :data-source="codeResults"
            :loading="loading"
            row-key="path"
            :row-selection="codeRowSelection"
            :pagination="{
              current: codePage.current,
              pageSize: codePage.pageSize,
              total: codeTotal,
              showSizeChanger: true,
              showTotal: (t: number) => `共 ${t} 篇`,
              onChange: handleCodePageChange
            }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <a-space :size="4">
                  <file-markdown-outlined style="color: #52c41a" />
                  <span>{{ record.name }}</span>
                  <a-typography-text type="secondary" style="font-size: 12px">{{ record.path }}</a-typography-text>
                </a-space>
              </template>
              <template v-else-if="column.key === 'repo_full_name'">
                <a :href="record.repo_url" target="_blank" rel="noopener">{{ record.repo_full_name }}</a>
              </template>
              <template v-else-if="column.key === 'repo_stars'">
                <a-space :size="4">
                  <star-outlined />
                  {{ record.repo_stars }}
                </a-space>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button type="link" size="small" @click="handlePreviewCode(record)">
                  <eye-outlined />
                  预览
                </a-button>
              </template>
            </template>
          </a-table>
        </div>
      </template>

      <!-- 仓库搜索结果（repo 模式） -->
      <template v-else>
        <a-table
          :columns="repoColumns"
          :data-source="repos"
          :loading="loading"
          row-key="id"
          style="margin-top: 16px"
          :pagination="{
            current: repoPage.current,
            pageSize: repoPage.pageSize,
            total: repoTotal,
            showSizeChanger: true,
            showTotal: (t: number) => `共 ${t} 个仓库`,
            onChange: handleRepoPageChange
          }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'full_name'">
              <a-space>
                <github-outlined />
                <a :href="record.url" target="_blank" rel="noopener">{{ record.full_name }}</a>
              </a-space>
            </template>
            <template v-else-if="column.key === 'description'">
              <span class="text-muted">{{ record.description || '-' }}</span>
            </template>
            <template v-else-if="column.key === 'stars'">
              <a-space :size="4">
                <star-outlined />
                {{ record.stars }}
              </a-space>
            </template>
            <template v-else-if="column.key === 'updated_at'">
              {{ formatDate(record.updated_at) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button type="link" size="small" @click="handleSelectRepo(record)">
                <file-markdown-outlined />
                选择文件
              </a-button>
            </template>
          </template>
        </a-table>
      </template>
    </div>

    <!-- Step 2: 选择文件（仅仓库模式） -->
    <div v-else-if="step === 'files'">
      <div class="step-header">
        <a-button type="link" @click="backToSearch">
          <arrow-left-outlined />
          返回搜索
        </a-button>
        <a-space class="repo-info">
          <github-outlined />
          <a :href="currentRepo?.url" target="_blank" rel="noopener">{{ currentRepo?.full_name }}</a>
          <a-tag v-if="currentRef">分支：{{ currentRef }}</a-tag>
          <a-tag color="blue">{{ files.length }} 个 Markdown 文件</a-tag>
        </a-space>
      </div>

      <a-table
        :columns="fileColumns"
        :data-source="files"
        :loading="filesLoading"
        row-key="path"
        :row-selection="fileRowSelection"
        :pagination="{ pageSize: 15, showSizeChanger: true }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'path'">
            <a-space :size="4">
              <file-markdown-outlined style="color: #52c41a" />
              <span>{{ record.path }}</span>
            </a-space>
          </template>
          <template v-else-if="column.key === 'size'">
            {{ formatSize(record.size) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="handlePreviewFile(record)">
              <eye-outlined />
              预览
            </a-button>
          </template>
        </template>
      </a-table>

      <!-- 导入配置 -->
      <a-card title="导入配置" style="margin-top: 16px">
        <a-form layout="inline">
          <a-form-item label="自动生成摘要">
            <a-switch v-model:checked="importConfig.autoSummary" />
          </a-form-item>
          <a-form-item label="自动生成标签">
            <a-switch v-model:checked="importConfig.autoTags" />
          </a-form-item>
          <a-form-item label="分类">
            <a-select
              v-model:value="importConfig.category_id"
              style="width: 180px"
              allow-clear
              placeholder="不指定分类"
            >
              <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
        <div style="margin-top: 16px">
          <a-button
            type="primary"
            size="large"
            :loading="importing"
            :disabled="selectedFileKeys.length === 0"
            @click="handleImportFiles"
          >
            <import-outlined />
            导入 {{ selectedFileKeys.length }} 篇为草稿
          </a-button>
          <span v-if="selectedFileKeys.length > 0" style="margin-left: 12px; color: rgba(0,0,0,0.45)">
            已选择 {{ selectedFileKeys.length }} 个文件，单次最多导入 20 篇
          </span>
        </div>
      </a-card>
    </div>

    <!-- Step 3: 导入结果 -->
    <div v-else-if="step === 'result'">
      <a-card>
        <a-result
          :status="importResult && importResult.failed === 0 ? 'success' : (importResult && importResult.imported > 0 ? 'warning' : 'error')"
          :title="`成功导入 ${importResult?.imported || 0} 篇，失败 ${importResult?.failed || 0} 篇`"
        >
          <template #extra>
            <a-space>
              <a-button type="primary" @click="backToSearchFromResult">继续搜索</a-button>
              <a-button v-if="searchMode === 'repo'" @click="backToFiles">返回文件列表</a-button>
            </a-space>
          </template>
        </a-result>

        <!-- 成功列表 -->
        <div v-if="importResult && importResult.results.length" style="margin-top: 16px">
          <h3><check-circle-outlined style="color: #52c41a" /> 导入成功</h3>
          <a-table
            :data-source="importResult.results"
            :columns="[
              { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
              { title: '来源路径', dataIndex: 'path', key: 'path', ellipsis: true },
              { title: '摘要', dataIndex: 'summary', key: 'summary', ellipsis: true },
              { title: '标签', dataIndex: 'tags', key: 'tags', width: 200 }
            ]"
            row-key="id"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'tags'">
                <a-tag v-for="tag in record.tags" :key="tag" color="blue">{{ tag }}</a-tag>
              </template>
            </template>
          </a-table>
        </div>

        <!-- 失败列表 -->
        <div v-if="importResult && importResult.failed_list.length" style="margin-top: 24px">
          <h3><close-circle-outlined style="color: #ff4d4f" /> 导入失败</h3>
          <a-table
            :data-source="importResult.failed_list"
            :columns="[
              { title: '路径', dataIndex: 'path', key: 'path', ellipsis: true },
              { title: '原因', dataIndex: 'reason', key: 'reason' }
            ]"
            row-key="path"
            :pagination="false"
            size="small"
          />
        </div>
      </a-card>
    </div>

    <!-- 预览抽屉 -->
    <a-drawer
      v-model:open="previewVisible"
      title="文件预览"
      width="60%"
      :destroyOnClose="true"
    >
      <a-spin :spinning="previewLoading">
        <div v-if="previewData">
          <a-alert
            v-if="previewData.truncated"
            message="内容过长，已截断显示前 8000 字符"
            type="info"
            show-icon
            style="margin-bottom: 12px"
          />
          <div class="markdown-preview" v-html="previewHtml"></div>
        </div>
        <a-empty v-else-if="!previewLoading" description="无内容" />
      </a-spin>
    </a-drawer>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 16px;
}

.page-desc {
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  margin-top: 4px;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.repo-info {
  font-size: 15px;
}

.text-muted {
  color: rgba(0, 0, 0, 0.45);
}

.list-toolbar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.import-config-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fafafa;
  padding: 12px 16px;
  border-radius: 6px;
}

.config-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
}

.markdown-preview {
  font-size: 14px;
  line-height: 1.8;
  word-wrap: break-word;
  max-height: 72vh;
  overflow: auto;
  padding: 8px 4px;
}
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin: 1.2em 0 0.6em;
  font-weight: 600;
  line-height: 1.3;
}
.markdown-preview :deep(h1) { font-size: 1.8em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
.markdown-preview :deep(h2) { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
.markdown-preview :deep(h3) { font-size: 1.25em; }
.markdown-preview :deep(h4) { font-size: 1em; }
.markdown-preview :deep(p) { margin: 0.6em 0; }
.markdown-preview :deep(a) { color: #1677ff; }
.markdown-preview :deep(code) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
  background: #f6f8fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}
.markdown-preview :deep(pre) {
  background: #f6f8fa;
  padding: 12px 16px;
  border-radius: 6px;
  overflow: auto;
  margin: 0.8em 0;
}
.markdown-preview :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 13px;
}
.markdown-preview :deep(blockquote) {
  margin: 0.8em 0;
  padding: 0 1em;
  color: #6a737d;
  border-left: 4px solid #dfe2e5;
}
.markdown-preview :deep(ul),
.markdown-preview :deep(ol) { padding-left: 2em; margin: 0.6em 0; }
.markdown-preview :deep(li) { margin: 0.3em 0; }
.markdown-preview :deep(table) {
  border-collapse: collapse;
  margin: 0.8em 0;
  width: 100%;
}
.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}
.markdown-preview :deep(th) { background: #f6f8fa; font-weight: 600; }
.markdown-preview :deep(img) { max-width: 100%; }
.markdown-preview :deep(hr) { border: 0; border-top: 1px solid #eaecef; margin: 1.2em 0; }
</style>
