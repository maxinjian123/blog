<script setup lang="ts">
import {computed, onMounted, reactive, ref} from 'vue'
import {message, Modal} from 'ant-design-vue'
import api from '@/utils/api'
import MonacoEditor from '@/components/MonacoEditor.vue'
import HighlightCode from '@/components/HighlightCode.vue'
import {
  ApiOutlined,
  BookOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  FileOutlined,
  FolderAddOutlined,
  FolderOutlined,
  LinkOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons-vue'

// ==================== 文件树 ====================
interface TreeNode {
  name: string
  path: string
  type: 'dir' | 'file'
  children?: TreeNode[]
  size?: number
  updatedAt?: string
}

const treeLoading = ref(false)
const treeData = ref<any[]>([])
const expandedKeys = ref<string[]>([])
const selectedPath = ref('')
const nodeMap = ref<Record<string, TreeNode>>({})

function buildNodeMap(nodes: TreeNode[]) {
  const map: Record<string, TreeNode> = {}
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      map[n.path] = n
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return map
}

function toTreeData(nodes: TreeNode[]): any[] {
  return (nodes || []).map((n) => ({
    title: n.name,
    key: n.path,
    path: n.path,
    name: n.name,
    type: n.type,
    isLeaf: n.type === 'file',
    children: n.type === 'dir' ? toTreeData(n.children || []) : undefined
  }))
}

async function fetchTree() {
  treeLoading.value = true
  try {
    const res: any = await api.get('/client-pages/tree')
    const data = res?.data || res || {}
    const tree = data?.tree || []
    treeData.value = toTreeData(tree)
    nodeMap.value = buildNodeMap(tree)
  } catch {
    message.error('加载文件树失败')
  } finally {
    treeLoading.value = false
  }
}

// ==================== 文件编辑（多标签导航） ====================
interface OpenTab {
  path: string
  name: string
}

const openTabs = ref<OpenTab[]>([])                      // 已打开的文件标签（按打开顺序）
const activePath = ref('')                               // 当前激活标签
const contentCache = ref<Record<string, string>>({})     // 已打开文件内容缓存（切换标签不丢失编辑）
const metaCache = ref<Record<string, any>>({})           // 已打开文件元信息缓存
const dirtyMap = ref<Record<string, boolean>>({})        // 各标签未保存标记
const fileLoading = ref(false)
const saving = ref(false)

// 当前激活文件的元信息
const activeMeta = computed(() => metaCache.value[activePath.value] || null)
// 当前激活文件是否未保存
const dirty = computed(() => !!dirtyMap.value[activePath.value])

// 编辑器双向绑定：读写对应标签的内容缓存
const editorContent = computed({
  get: () => contentCache.value[activePath.value] || '',
  set: (v: string) => {
    if (!activePath.value) return
    contentCache.value[activePath.value] = v
    dirtyMap.value[activePath.value] = true
  }
})

// 确保标签存在（不切换）
function ensureTab(path: string, name: string) {
  if (!openTabs.value.some((t) => t.path === path)) {
    openTabs.value.push({path, name})
  }
}

// 激活标签：切换编辑区；首次打开时从后端加载并缓存
async function activateTab(path: string, name: string) {
  ensureTab(path, name)
  activePath.value = path
  if (contentCache.value[path] !== undefined) return // 已缓存，直接切换

  fileLoading.value = true
  try {
    const res: any = await api.get('/client-pages/file', {params: {path}})
    const data = res?.data || res || {}
    metaCache.value[path] = data
    contentCache.value[path] = data.isText === false ? '' : (data.content || '')
  } catch (err: any) {
    message.error(err?.response?.data?.message || '读取文件失败')
  } finally {
    fileLoading.value = false
  }
}

// 打开文件（文件树点击）
function openFile(node: TreeNode) {
  activateTab(node.path, node.name)
}

// 点击标签切换
function switchTab(path: string) {
  const tab = openTabs.value.find((t) => t.path === path)
  if (!tab) return
  activateTab(tab.path, tab.name)
}

// 关闭标签：移除缓存；若关闭的是激活标签则激活相邻标签
function closeTab(path: string) {
  const idx = openTabs.value.findIndex((t) => t.path === path)
  if (idx === -1) return
  openTabs.value.splice(idx, 1)
  delete contentCache.value[path]
  delete metaCache.value[path]
  delete dirtyMap.value[path]
  if (activePath.value === path) {
    const next = openTabs.value[idx - 1] || openTabs.value[idx] || openTabs.value[idx + 1]
    if (next) {
      activePath.value = next.path
    } else {
      activePath.value = ''
      selectedPath.value = ''
    }
  }
}

function onSelect(_keys: any, info: any) {
  const node = info?.node as TreeNode
  if (!node) return
  selectedPath.value = node.path
  if (node.type === 'file') {
    openFile(node)
  } else {
    // 目录：不关闭已打开标签，仅取消激活编辑区
    activePath.value = ''
  }
}

function onExpand(keys: string[]) {
  expandedKeys.value = keys
}

async function saveFile() {
  const path = activePath.value
  if (!path) return
  saving.value = true
  try {
    await api.put('/client-pages/file', {path, content: contentCache.value[path] || ''})
    message.success('文件已保存')
    dirtyMap.value[path] = false
    fetchTree()
  } catch (err: any) {
    message.error(err?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function editorLang(path: string): 'html' | 'css' | 'javascript' {
  const ext = (path.split('.').pop() || '').toLowerCase()
  if (ext === 'html' || ext === 'htm') return 'html'
  if (ext === 'css') return 'css'
  return 'javascript'
}

// ==================== 新建 / 重命名 / 删除 ====================
function getParentDir(): string {
  if (!selectedPath.value) return ''
  const node = nodeMap.value[selectedPath.value]
  if (node?.type === 'dir') return node.path
  const idx = selectedPath.value.lastIndexOf('/')
  return idx === -1 ? '' : selectedPath.value.slice(0, idx)
}

// 展开目标路径的所有父目录，并选中目标
function reveal(path: string) {
  const parts = path.split('/')
  const dirs: string[] = []
  let cur = ''
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur ? `${cur}/${parts[i]}` : parts[i]
    dirs.push(cur)
  }
  expandedKeys.value = Array.from(new Set([...expandedKeys.value, ...dirs]))
  selectedPath.value = path
  const node = nodeMap.value[path]
  if (node?.type === 'file') openFile(node)
}

// 新建文件 / 目录
const createModal = reactive({visible: false, type: 'file' as 'file' | 'dir', name: '', dir: ''})

function openCreate(type: 'file' | 'dir') {
  createModal.type = type
  createModal.name = ''
  createModal.dir = getParentDir()
  createModal.visible = true
}

async function submitCreate() {
  const name = createModal.name.trim()
  if (!name) {
    message.warning('请输入名称')
    return
  }
  const rel = createModal.dir.trim() ? `${createModal.dir.trim()}/${name}` : name
  try {
    if (createModal.type === 'file') {
      await api.post('/client-pages/file', {path: rel, content: ''})
      message.success('文件已创建')
    } else {
      await api.post('/client-pages/dir', {path: rel})
      message.success('目录已创建')
    }
    createModal.visible = false
    await fetchTree()
    reveal(rel)
  } catch (err: any) {
    message.error(err?.response?.data?.message || '创建失败')
  }
}

// 新建页面（模板）
const pageModal = reactive({visible: false, name: ''})

function openCreatePage() {
  pageModal.name = ''
  pageModal.visible = true
}

async function submitCreatePage() {
  const name = pageModal.name.trim()
  if (!name) {
    message.warning('请输入页面名称')
    return
  }
  try {
    const res: any = await api.post('/client-pages/page', {name})
    const rel = res?.data?.path || res?.path
    pageModal.visible = false
    message.success('页面已创建')
    await fetchTree()
    if (rel) reveal(`${rel}/index.html`)
  } catch (err: any) {
    message.error(err?.response?.data?.message || '创建失败')
  }
}

// 重命名
const renameModal = reactive({visible: false, oldPath: '', newName: ''})

function openRename() {
  if (!selectedPath.value) {
    message.warning('请先选择文件或目录')
    return
  }
  renameModal.oldPath = selectedPath.value
  renameModal.newName = nodeMap.value[selectedPath.value]?.name || ''
  renameModal.visible = true
}

async function submitRename() {
  const newName = renameModal.newName.trim()
  if (!newName) {
    message.warning('请输入新名称')
    return
  }
  const idx = renameModal.oldPath.lastIndexOf('/')
  const to = idx === -1 ? newName : `${renameModal.oldPath.slice(0, idx)}/${newName}`
  try {
    await api.put('/client-pages/rename', {from: renameModal.oldPath, to})
    message.success('重命名成功')
    renameModal.visible = false
    await fetchTree()
    reveal(to)
  } catch (err: any) {
    message.error(err?.response?.data?.message || '重命名失败')
  }
}

// 删除
function removeSelected() {
  if (!selectedPath.value) {
    message.warning('请先选择文件或目录')
    return
  }
  const node = nodeMap.value[selectedPath.value]
  const isDir = node?.type === 'dir'
  Modal.confirm({
    title: `删除${isDir ? '目录' : '文件'}`,
    content: `确定删除「${selectedPath.value}」吗？${isDir ? '目录下的所有内容将一并删除，' : ''}删除后不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      const p = selectedPath.value
      try {
        if (isDir) {
          await api.delete('/client-pages/dir', {params: {path: p}})
        } else {
          await api.delete('/client-pages/file', {params: {path: p}})
        }
        message.success('已删除')
        selectedPath.value = ''
        closeTab(p) // 关闭对应标签（若已打开）
        await fetchTree()
      } catch (err: any) {
        message.error(err?.response?.data?.message || '删除失败')
      }
    }
  })
}

// ==================== 访问地址 / 预览 ====================
// 基于后端地址拼接（后端 public 目录静态资源）
function getBackendOrigin(): string {
  const base = (api.defaults.baseURL as string) || ''
  if (base.startsWith('http')) {
    return base.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '')
  }
  const envBackend = (import.meta.env.VITE_APP_BACKEND_URL as string) || ''
  return envBackend.replace(/\/+$/, '')
}

function fileUrl(path: string): string {
  const origin = getBackendOrigin()
  return origin ? `${origin}/${path}` : `/${path}`
}

function openPreview() {
  if (!activePath.value) {
    message.warning('请先选择文件')
    return
  }
  window.open(fileUrl(activePath.value), '_blank')
}

function copyFileUrl() {
  if (!activePath.value) return
  const url = fileUrl(activePath.value)
  navigator.clipboard?.writeText(url).then(() => {
    message.success('访问地址已复制')
  }).catch(() => {
    message.warning('复制失败，请手动复制：' + url)
  })
}

// ==================== 接口文档（后端返回全部接口，动态获取） ====================
const apiDocs = ref<{total: number; groups: any[]}>({total: 0, groups: []})
const docsLoading = ref(false)
const docTag = ref('')
const docPublicOnly = ref(false)
const docKeyword = ref('')

// 模块（标签）列表
const docTags = computed(() => (apiDocs.value.groups || []).map((g: any) => g.title))

// 展平并按筛选条件过滤
const flatApiDocs = computed(() => {
  let items = (apiDocs.value.groups || []).flatMap((g: any) =>
    (g.items || []).map((i: any) => ({
      ...i,
      desc: i.summary || i.description || '',
      parameters: (i.parameters || []).map((p: any, idx: number) => ({
        ...p,
        _k: `${p.in}-${p.name}-${idx}`
      })),
      section: g.title,
      _rowKey: `${g.title}|${i.method}|${i.path}`
    }))
  )
  if (docTag.value) items = items.filter((i: any) => i.tag === docTag.value)
  if (docPublicOnly.value) items = items.filter((i: any) => !i.auth)
  const kw = docKeyword.value.trim().toLowerCase()
  if (kw) {
    items = items.filter((i: any) =>
      i.path.toLowerCase().includes(kw) ||
      (i.summary || '').toLowerCase().includes(kw) ||
      (i.description || '').toLowerCase().includes(kw)
    )
  }
  return items
})

async function fetchApiDocs() {
  docsLoading.value = true
  try {
    const res: any = await api.get('/site/api-docs')
    apiDocs.value = res?.data || res || {total: 0, groups: []}
  } catch {
    apiDocs.value = {total: 0, groups: []}
    message.error('加载接口文档失败')
  } finally {
    docsLoading.value = false
  }
}

// 请求方法 -> 标签颜色
function methodColor(method: string): string {
  const map: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple'
  }
  return map[method] || 'default'
}

// 对象 -> 格式化 JSON 字符串
function formatJson(obj: any): string {
  if (obj === null || obj === undefined) return ''
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

const paramColumns = [
  {title: '参数', key: 'name', dataIndex: 'name', width: 150},
  {title: '位置', key: 'in', dataIndex: 'in', width: 70},
  {title: '类型', key: 'type', dataIndex: 'type', width: 80},
  {title: '必填', key: 'required', dataIndex: 'required', width: 70},
  {title: '说明', key: 'description', dataIndex: 'description'}
]

const helperExample = `// 自定义页面内置三个全局对象，统一封装在公共脚本 public/common.js 中
// （新建页面模板通过 <script src="/common.js"> 自动引用，可在管理端直接编辑该文件）：
// window.BLOG_CONFIG —— 页面配置（apiBase、siteUrl 等）
// window.BlogAPI      —— 通用 API 客户端（get / post / put / del）
// window.BlogApi      —— 全部公开接口封装的可直接调用函数

async function loadArticles() {
  // 1. 获取文章列表（自动只返回已发布文章）
  const list = await BlogApi.getArticles({ page: 1, pageSize: 10, sort: 'published_at' });
  // list = { list: [...], pagination: { page, pageSize, total, totalPages } }
  console.log(list.list, list.pagination.total);

  // 2. 获取站点信息
  const info = await BlogApi.getSiteInfo();
  document.title = info.site_name;

  // 3. 发表评论（需先取验证码）
  const captcha = await BlogApi.getCaptcha();
  // captcha = { key: '...', svg: '<svg>...' } —— 把 svg 渲染给用户填写验证码
  await BlogApi.postArticleComment(1, {
    content: '写得好！',
    qq_number: '123456',
    captcha_key: captcha.key,
    captcha_code: '用户输入'
  });
}

// 注：完整接口文档见 Swagger（/api-docs），本页全部接口由后端 Swagger 规范实时生成。`

const swaggerUrl = `${window.location.origin}/api-docs`

const apiDocColumns = [
  {title: '模块', key: 'section', dataIndex: 'section', width: 100},
  {title: '方法', key: 'method', dataIndex: 'method', width: 90},
  {title: '路径', key: 'path', dataIndex: 'path'},
  {title: '说明', key: 'desc', dataIndex: 'desc'},
  {title: '请求示例', key: 'usage', dataIndex: 'usage', width: 340}
]

onMounted(() => {
  fetchTree()
  fetchApiDocs()
})
</script>

<template>
  <div>
    <a-tabs default-active-key="files">
      <!-- ============ 文件管理 ============ -->
      <a-tab-pane key="files" tab="文件管理">
        <a-card :bordered="false">
          <div class="toolbar">
            <a-space wrap>
              <a-button size="small" type="primary" @click="openCreatePage">
                <template #icon><plus-outlined/></template>
                新建页面
              </a-button>
              <a-button size="small" @click="openCreate('file')">
                <template #icon><file-add-outlined/></template>
                新建文件
              </a-button>
              <a-button size="small" @click="openCreate('dir')">
                <template #icon><folder-add-outlined/></template>
                新建目录
              </a-button>
              <a-button size="small" @click="openRename">
                <template #icon><edit-outlined/></template>
                重命名
              </a-button>
              <a-button size="small" danger @click="removeSelected">
                <template #icon><delete-outlined/></template>
                删除
              </a-button>
              <a-button size="small" :loading="treeLoading" @click="fetchTree">
                <template #icon><reload-outlined/></template>
                刷新
              </a-button>

            </a-space>
            <span class="toolbar-tip">
              <link-outlined/>
              文件直接保存在后端 <code>public/</code> 目录，通过 <code>/路径</code> 链接访问
            </span>
          </div>

          <div class="file-manager">
            <!-- 文件树 -->
            <div class="file-tree-panel">
              <a-tree
                v-model:expandedKeys="expandedKeys"
                :tree-data="treeData"
                :selected-keys="selectedPath ? [selectedPath] : []"
                :loading="treeLoading"
                block-node
                show-icon
                @select="onSelect"
                @expand="onExpand"
              >
                <template #icon="{ data }">
                  <folder-outlined v-if="data.type === 'dir'" class="tree-dir-icon"/>
                  <file-outlined v-else class="tree-file-icon"/>
                </template>
              </a-tree>
            </div>

            <!-- 编辑器 -->
            <div class="file-editor-panel">
              <!-- 打开文件标签栏 -->
              <div v-if="openTabs.length" class="open-tabs">
                <div
                  v-for="tab in openTabs"
                  :key="tab.path"
                  class="open-tab"
                  :class="{active: tab.path === activePath}"
                  :title="tab.path"
                  @click="switchTab(tab.path)"
                >
                  <file-outlined class="tab-file-icon"/>
                  <span class="tab-name">{{ tab.name }}</span>
                  <span v-if="dirtyMap[tab.path]" class="tab-dirty">●</span>
                  <close-outlined class="tab-close" @click.stop="closeTab(tab.path)"/>
                </div>
              </div>

              <template v-if="activePath">
                <div class="editor-header">
                  <div class="editor-title">
                    <code>{{ activePath }}</code>
                    <a-spin v-if="fileLoading" size="small"/>
                  </div>
                  <a-space>
                    <a-button size="small" @click="copyFileUrl">
                      <template #icon><link-outlined/></template>
                      复制地址
                    </a-button>
                    <a-button size="small" @click="openPreview">
                      <template #icon><eye-outlined/></template>
                      预览
                    </a-button>
                    <a-button size="small" type="primary" :loading="saving" @click="saveFile">
                      <template #icon><save-outlined/></template>
                      保存{{ dirty ? ' *' : '' }}
                    </a-button>
                  </a-space>
                </div>

                <div v-if="activeMeta && activeMeta.isText === false" class="binary-hint">
                  该文件为二进制文件（{{ activeMeta.size }} 字节），无法在线编辑，可通过「预览」查看。
                </div>
                <div v-else class="editor-body">
                  <MonacoEditor
                    v-if="activePath"
                    :key="activePath"
                    v-model="editorContent"
                    :language="editorLang(activePath)"
                    :placeholder="`在此编辑 ${activePath}（支持语法高亮与代码提示）…`"
                  />
                </div>
              </template>

              <div v-else class="editor-empty">
                <a-empty
                  :description="openTabs.length ? '已选择目录，可点击上方标签切换已打开的文件' : '从左侧文件树选择文件进行编辑，或点击「新建页面」创建自定义页面'"
                />
              </div>
            </div>
          </div>
        </a-card>
      </a-tab-pane>

      <!-- ============ 接口文档 ============ -->
      <a-tab-pane key="docs" tab="接口文档">
        <a-card :bordered="false">
          <a-alert type="info" show-icon style="margin-bottom: 16px">
            <template #message>
              完整接口文档见
              <a :href="swaggerUrl" target="_blank">Swagger 文档</a>
              （本地开发：<code>http://localhost:3000/api-docs</code>）。
              以下为后端<b>全部 {{ apiDocs.total }} 个接口</b>，由 Swagger 规范实时生成。
            </template>
          </a-alert>

          <a-typography>
            <a-typography-title :level="5">
              <api-outlined/> 内置全局对象
            </a-typography-title>
            <a-typography-paragraph>
              封装脚本统一存放于公共文件 <code>public/common.js</code>（新建页面模板通过
              <code>&lt;script src="/common.js"&gt;&lt;/script&gt;</code> 自动引用，可在此页文件树直接编辑）。
              它提供 <code>window.BLOG_CONFIG</code>（页面配置）、
              <code>window.BlogAPI</code>（通用客户端）与
              <code>window.BlogApi</code>（全部公开接口封装函数），无需自己拼接请求。
            </a-typography-paragraph>
            <HighlightCode :code="helperExample" language="javascript"/>
          </a-typography>

          <a-typography-title :level="5" style="margin-top: 24px">
            <book-outlined/> 全部接口
            <span style="color:#999;font-weight:normal;font-size:12px;margin-left:8px">
              共 {{ flatApiDocs.length }} / {{ apiDocs.total }} 个
            </span>
          </a-typography-title>

          <div class="doc-filter">
            <a-select
              v-model:value="docTag"
              allow-clear
              placeholder="按模块筛选"
              style="width: 160px"
              :options="docTags.map((t: string) => ({label: t, value: t}))"
            />
            <a-input-search
              v-model:value="docKeyword"
              placeholder="搜索路径 / 说明"
              allow-clear
              style="width: 260px"
            />
            <a-switch v-model:checked="docPublicOnly" checked-children="仅公开" un-checked-children="全部"/>
            <a-button size="small" :loading="docsLoading" @click="fetchApiDocs">
              <template #icon><reload-outlined/></template>
              刷新
            </a-button>
          </div>

          <a-table
            :data-source="flatApiDocs"
            :columns="apiDocColumns"
            size="small"
            :loading="docsLoading"
            row-key="_rowKey"
            :pagination="{pageSize: 20, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条接口`}"
            :scroll="{x: 1000}"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'method'">
                <a-tag :color="methodColor(record.method)">{{ record.method }}</a-tag>
              </template>
              <template v-else-if="column.key === 'path'">
                <code class="doc-path">
                  <lock-outlined v-if="record.auth" class="doc-auth-icon" title="需要管理员登录"/>
                  /api/v1{{ record.path }}
                </code>
              </template>
              <template v-else-if="column.key === 'usage'">
                <div class="doc-usage-cell">
                  <HighlightCode :code="record.usage" language="javascript"/>
                </div>
              </template>
            </template>
            <template #expandedRowRender="{ record }">
              <div class="doc-example">
                <div class="doc-example-title">请求示例</div>
                <HighlightCode :code="record.usage" language="javascript"/>

                <template v-if="record.parameters && record.parameters.length">
                  <div class="doc-example-title">参数</div>
                  <a-table
                    :data-source="record.parameters"
                    :columns="paramColumns"
                    :pagination="false"
                    size="small"
                    row-key="_k"
                  >
                    <template #bodyCell="{ column, record: p }">
                      <template v-if="column.key === 'required'">
                        <a-tag v-if="p.required" color="red">必填</a-tag>
                        <span v-else style="color:#999">选填</span>
                      </template>
                    </template>
                  </a-table>
                </template>

                <template v-if="record.requestBody">
                  <div class="doc-example-title">请求体</div>
                  <HighlightCode :code="formatJson(record.requestBody)" language="json"/>
                </template>

                <template v-if="record.responseExample !== null && record.responseExample !== undefined">
                  <div class="doc-example-title">返回示例</div>
                  <HighlightCode :code="formatJson(record.responseExample)" language="json"/>
                </template>
              </div>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- ============ 新建文件 / 目录 ============ -->
    <a-modal
      v-model:open="createModal.visible"
      :title="createModal.type === 'file' ? '新建文件' : '新建目录'"
      :ok-text="createModal.type === 'file' ? '创建文件' : '创建目录'"
      cancel-text="取消"
      @ok="submitCreate"
    >
      <a-form layout="vertical">
        <a-form-item label="所在目录（相对 public，留空为根目录）">
          <a-input v-model:value="createModal.dir" placeholder="例如 home"/>
        </a-form-item>
        <a-form-item :label="createModal.type === 'file' ? '文件名' : '目录名'">
          <a-input
            v-model:value="createModal.name"
            :placeholder="createModal.type === 'file' ? '例如 index.html' : '例如 home'"
            @keyup.enter="submitCreate"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- ============ 新建页面 ============ -->
    <a-modal
      v-model:open="pageModal.visible"
      title="新建页面"
      ok-text="创建页面"
      cancel-text="取消"
      @ok="submitCreatePage"
    >
      <a-form layout="vertical">
        <a-form-item
          label="页面名称"
          extra="将在 public/<名称>/ 下创建 index.html / style.css / script.js 模板；全局封装脚本统一存放在 public/common.js（自动引用，含 BlogAPI 与全部公开接口封装函数 BlogApi）"
        >
          <a-input
            v-model:value="pageModal.name"
            placeholder="例如：首页"
            @keyup.enter="submitCreatePage"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- ============ 重命名 ============ -->
    <a-modal
      v-model:open="renameModal.visible"
      title="重命名"
      ok-text="确定"
      cancel-text="取消"
      @ok="submitRename"
    >
      <a-form layout="vertical">
        <a-form-item label="当前路径">
          <code>{{ renameModal.oldPath }}</code>
        </a-form-item>
        <a-form-item label="新名称">
          <a-input
            v-model:value="renameModal.newName"
            @keyup.enter="submitRename"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  justify-content: space-between;
}
.toolbar-tip {
  color: #888;
  font-size: 13px;
}
.toolbar-tip code {
  background: #f0f2f5;
  padding: 1px 6px;
  border-radius: 4px;
}
.file-manager {
  display: flex;
  gap: 16px;
  align-items: stretch;
  min-height: 520px;
}
.file-tree-panel {
  flex: 0 0 300px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
  overflow: auto;
  height: calc(100vh - 350px);
  background: #fff;
}
.tree-dir-icon {
  color: #f7b84b;
}
.tree-file-icon {
  color: #8ab4f8;
}
.file-editor-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
/* 打开文件标签栏 */
.open-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 0 0 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid #f0f0f0;
}
.open-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 6px 6px 0 0;
  border-bottom: none;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  background: #fafafa;
  color: #666;
  transition: all 0.2s;
  user-select: none;
}
.open-tab:hover {
  background: #f0f2f5;
}
.open-tab.active {
  background: #fff;
  border-color: #1677ff;
  color: #1677ff;
  font-weight: 500;
}
.tab-file-icon {
  color: #8ab4f8;
}
.tab-dirty {
  color: #faad14;
  font-size: 10px;
}
.tab-close {
  font-size: 12px;
  color: #bbb;
  border-radius: 50%;
  padding: 1px;
}
.tab-close:hover {
  color: #fff;
  background: #ff4d4f;
}
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px 10px;
  gap: 12px;
  flex-wrap: wrap;
}
.editor-title code {
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
}
.editor-body {
  flex: 1;
}
.binary-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  min-height: 420px;
}
.editor-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  min-height: 420px;
}
.doc-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.doc-path {
  font-size: 12px;
}
.doc-auth-icon {
  color: #faad14;
  margin-right: 4px;
}
.doc-usage-cell {
  max-width: 340px;
  max-height: 120px;
  overflow: auto;
}
.doc-example {
  padding: 8px 0;
}
.doc-example-title {
  font-size: 12px;
  color: #888;
  margin: 8px 0 4px;
}
.doc-example-title:first-child {
  margin-top: 0;
}
</style>
