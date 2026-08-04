<script setup lang="ts">
import {h, onMounted, reactive, ref} from 'vue'
import api from '@/utils/api'
import {message, Modal} from 'ant-design-vue'
import {
  ExclamationCircleOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'

interface EmojiRecord {
  id: number
  emoji: string
  name: string
  category: string
  sort_order: number
  enabled: boolean
  created_at: string
  updated_at: string
}

interface EmojiPackRecord {
  id: number
  name: string
  url: string
  category: string
  sort_order: number
  enabled: boolean
  created_at: string
  updated_at: string
}

interface MediaItem {
  id: string
  url: string
  original_name?: string
  mime_type?: string
}

const activeTab = ref<'emoji' | 'pack'>('emoji')

// ============ 文本表情 ============
const list = ref<EmojiRecord[]>([])
const loading = ref(false)
const saving = ref(false)
const total = ref(0)
const quickEmojis = ref<string[]>([])
const categories = ref<string[]>([])

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  category: undefined as string | undefined,
  enabled: undefined as boolean | undefined
})

const modalVisible = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  emoji: '',
  name: '',
  category: 'default',
  sort_order: 0,
  enabled: true
})

const columns = [
  {
    title: '表情',
    dataIndex: 'emoji',
    key: 'emoji',
    width: 90,
    align: 'center' as const
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
    customRender: ({text}: { text: string }) => text || '-'
  },
  {title: '分类', key: 'category', dataIndex: 'category', width: 120, align: 'center' as const},
  {
    title: '排序',
    dataIndex: 'sort_order',
    key: 'sort_order',
    width: 90,
    align: 'center' as const
  },
  {title: '状态', key: 'enabled', dataIndex: 'enabled', width: 90, align: 'center' as const},
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    customRender: ({text}: { text: string }) =>
        text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'
  },
  {title: '操作', key: 'action', width: 130, align: 'center' as const}
]

function buildParams(): Record<string, any> {
  const params: Record<string, any> = {page: query.page, pageSize: query.pageSize}
  if (query.keyword) params.keyword = query.keyword
  if (query.category) params.category = query.category
  if (query.enabled !== undefined) params.enabled = query.enabled
  return params
}

async function loadData() {
  loading.value = true
  try {
    const res: any = await api.get('/emojis/admin', {params: buildParams()})
    list.value = res.data?.list || []
    total.value = res.data?.pagination?.total ?? res.data?.total ?? 0
  } catch {
    message.error('加载表情列表失败')
  } finally {
    loading.value = false
  }
}

async function loadQuickEmojis() {
  try {
    const res: any = await api.get('/emojis')
    quickEmojis.value = res.data?.emojis || []
  } catch {
    quickEmojis.value = []
  }
}

async function loadCategories() {
  try {
    const res: any = await api.get('/emojis/admin/categories')
    categories.value = res.data || []
  } catch {
    categories.value = []
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.category = undefined
  query.enabled = undefined
  query.page = 1
  loadData()
}

function handleTableChange(pag: { current: number; pageSize: number }) {
  query.page = pag.current
  query.pageSize = pag.pageSize
  loadData()
}

function openCreate() {
  editingId.value = null
  form.emoji = ''
  form.name = ''
  form.category = 'default'
  form.sort_order = list.value.reduce((max, r) => Math.max(max, r.sort_order || 0), 0) + 1
  form.enabled = true
  modalVisible.value = true
}

function openEdit(record: EmojiRecord) {
  editingId.value = record.id
  form.emoji = record.emoji
  form.name = record.name || ''
  form.category = record.category || 'default'
  form.sort_order = record.sort_order || 0
  form.enabled = record.enabled
  modalVisible.value = true
}

function pickEmoji(emoji: string) {
  form.emoji = emoji
}

async function handleSave() {
  const emoji = form.emoji.trim()
  if (!emoji) {
    message.warning('请输入或选择表情')
    return
  }
  saving.value = true
  const payload = {
    emoji,
    name: form.name.trim(),
    category: form.category.trim() || 'default',
    sort_order: form.sort_order,
    enabled: form.enabled
  }
  try {
    if (editingId.value) {
      const res: any = await api.put(`/emojis/${editingId.value}`, payload)
      message.success(res.message || '表情更新成功')
    } else {
      const res: any = await api.post('/emojis', payload)
      message.success(res.message || '表情创建成功')
    }
    modalVisible.value = false
    loadData()
    loadQuickEmojis()
    loadCategories()
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleToggle(record: EmojiRecord) {
  try {
    await api.put(`/emojis/${record.id}`, {enabled: !record.enabled})
    record.enabled = !record.enabled
    message.success(record.enabled ? '已启用' : '已停用')
  } catch {
    message.error('状态更新失败')
  }
}

function handleDelete(record: EmojiRecord) {
  Modal.confirm({
    title: '确认删除表情',
    icon: h(ExclamationCircleOutlined),
    content: `确定要删除表情 ${record.emoji} 吗？删除后编辑器中将不再显示。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await api.delete(`/emojis/${record.id}`)
        message.success('表情删除成功')
        loadData()
        loadQuickEmojis()
        loadCategories()
      } catch {
        message.error('删除失败')
      }
    }
  })
}

// ============ 图片表情包 ============
const packList = ref<EmojiPackRecord[]>([])
const packLoading = ref(false)
const packSaving = ref(false)
const packTotal = ref(0)
const packCategories = ref<string[]>([])

const packQuery = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  category: undefined as string | undefined,
  enabled: undefined as boolean | undefined
})

const packModalVisible = ref(false)
const packEditingId = ref<number | null>(null)
const packUploading = ref(false)
const packForm = reactive({
  name: '',
  url: '',
  category: 'default',
  sort_order: 0,
  enabled: true
})

const mediaPickerVisible = ref(false)
const mediaLoading = ref(false)
const mediaList = ref<MediaItem[]>([])
const mediaPage = ref(1)
const mediaTotal = ref(0)
const mediaKeyword = ref('')

const packColumns = [
  {
    title: '预览',
    key: 'preview',
    dataIndex: 'url',
    width: 90,
    align: 'center' as const,
    customRender: ({record}: { record: EmojiPackRecord }) =>
        h('img', {
          src: record.url,
          alt: record.name || '表情包',
          style: {width: '48px', height: '48px', objectFit: 'contain', borderRadius: '4px'}
        })
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
    customRender: ({text}: { text: string }) => text || '-'
  },
  {title: '图片地址', dataIndex: 'url', key: 'url', ellipsis: true},
  {title: '分类', key: 'category', dataIndex: 'category', width: 120, align: 'center' as const},
  {
    title: '排序',
    dataIndex: 'sort_order',
    key: 'sort_order',
    width: 90,
    align: 'center' as const
  },
  {title: '状态', key: 'enabled', dataIndex: 'enabled', width: 90, align: 'center' as const},
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    customRender: ({text}: { text: string }) =>
        text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'
  },
  {title: '操作', key: 'action', width: 130, align: 'center' as const}
]

function buildPackParams(): Record<string, any> {
  const params: Record<string, any> = {
    page: packQuery.page,
    pageSize: packQuery.pageSize
  }
  if (packQuery.keyword) params.keyword = packQuery.keyword
  if (packQuery.category) params.category = packQuery.category
  if (packQuery.enabled !== undefined) params.enabled = packQuery.enabled
  return params
}

async function loadPacks() {
  packLoading.value = true
  try {
    const res: any = await api.get('/emoji-packs/admin', {params: buildPackParams()})
    packList.value = res.data?.list || []
    packTotal.value = res.data?.pagination?.total ?? res.data?.total ?? 0
  } catch {
    message.error('加载表情包列表失败')
  } finally {
    packLoading.value = false
  }
}

async function loadPackCategories() {
  try {
    const res: any = await api.get('/emoji-packs/admin/categories')
    packCategories.value = res.data || []
  } catch {
    packCategories.value = []
  }
}

function handlePackSearch() {
  packQuery.page = 1
  loadPacks()
}

function handlePackReset() {
  packQuery.keyword = ''
  packQuery.category = undefined
  packQuery.enabled = undefined
  packQuery.page = 1
  loadPacks()
}

function handlePackTableChange(pag: { current: number; pageSize: number }) {
  packQuery.page = pag.current
  packQuery.pageSize = pag.pageSize
  loadPacks()
}

function openPackCreate() {
  packEditingId.value = null
  packForm.name = ''
  packForm.url = ''
  packForm.category = 'default'
  packForm.sort_order =
      packList.value.reduce((max, r) => Math.max(max, r.sort_order || 0), 0) + 1
  packForm.enabled = true
  packModalVisible.value = true
}

function openPackEdit(record: EmojiPackRecord) {
  packEditingId.value = record.id
  packForm.name = record.name || ''
  packForm.url = record.url || ''
  packForm.category = record.category || 'default'
  packForm.sort_order = record.sort_order || 0
  packForm.enabled = record.enabled
  packModalVisible.value = true
}

async function handlePackSave() {
  const url = packForm.url.trim()
  if (!url) {
    message.warning('请填写图片链接或上传图片')
    return
  }
  if (!/^(https?:\/\/|\/uploads\/|data:image\/)/i.test(url)) {
    message.warning('图片链接需以 http/https 或 /uploads/ 开头')
    return
  }
  packSaving.value = true
  const payload = {
    name: packForm.name.trim(),
    url,
    category: packForm.category.trim() || 'default',
    sort_order: packForm.sort_order,
    enabled: packForm.enabled
  }
  try {
    if (packEditingId.value) {
      const res: any = await api.put(`/emoji-packs/${packEditingId.value}`, payload)
      message.success(res.message || '表情包更新成功')
    } else {
      const res: any = await api.post('/emoji-packs', payload)
      message.success(res.message || '表情包创建成功')
    }
    packModalVisible.value = false
    loadPacks()
    loadPackCategories()
  } catch {
    message.error('保存失败')
  } finally {
    packSaving.value = false
  }
}

async function handlePackToggle(record: EmojiPackRecord) {
  try {
    await api.put(`/emoji-packs/${record.id}`, {enabled: !record.enabled})
    record.enabled = !record.enabled
    message.success(record.enabled ? '已启用' : '已停用')
  } catch {
    message.error('状态更新失败')
  }
}

function handlePackDelete(record: EmojiPackRecord) {
  Modal.confirm({
    title: '确认删除表情包',
    icon: h(ExclamationCircleOutlined),
    content: `确定要删除表情包 ${record.name || record.url} 吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await api.delete(`/emoji-packs/${record.id}`)
        message.success('表情包删除成功')
        loadPacks()
        loadPackCategories()
      } catch {
        message.error('删除失败')
      }
    }
  })
}

async function openMediaPicker() {
  mediaPickerVisible.value = true
  mediaPage.value = 1
  mediaKeyword.value = ''
  await loadMediaImages()
}

async function loadMediaImages() {
  mediaLoading.value = true
  try {
    const res: any = await api.get('/media', {
      params: {
        page: mediaPage.value,
        pageSize: 30,
        mime: 'image',
        keyword: mediaKeyword.value || undefined
      }
    })
    mediaList.value = res.data?.list || []
    mediaTotal.value = res.data?.total ?? 0
  } catch {
    mediaList.value = []
  } finally {
    mediaLoading.value = false
  }
}

function handleMediaSearch() {
  mediaPage.value = 1
  loadMediaImages()
}

function selectMedia(item: MediaItem) {
  packForm.url = item.url
  mediaPickerVisible.value = false
}

async function handlePackUpload(file: File): Promise<boolean> {
  if (!file) return false
  if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
    message.warning('仅支持 JPG / PNG / GIF / WebP 图片')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    message.warning('图片不能超过 5MB')
    return false
  }
  packUploading.value = true
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res: any = await api.post('/emoji-packs/upload', formData, {
      headers: {'Content-Type': 'multipart/form-data'}
    })
    const data = res.data
    packForm.url = data.url
    message.success(
        data.resized ? `上传成功，已自动压缩至 ${data.width}×${data.height}` : '上传成功'
    )
  } catch {
    message.error('上传失败')
  } finally {
    packUploading.value = false
  }
  return false
}

onMounted(() => {
  loadData()
  loadQuickEmojis()
  loadCategories()
  loadPacks()
  loadPackCategories()
})
</script>

<template>
  <div>
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="emoji" tab="文本表情">
        <div class="page-header">
          <h2>文本表情管理</h2>
          <a-space>
            <a-input-search
                v-model:value="query.keyword"
                placeholder="搜索表情 / 名称..."
                style="width: 220px"
                allow-clear
                @search="handleSearch"
            >
              <template #enterButton>
                <SearchOutlined/>
              </template>
            </a-input-search>
            <a-select
                v-model:value="query.category"
                placeholder="全部分类"
                style="width: 130px"
                allow-clear
                :options="categories.map((c) => ({value: c, label: c}))"
                @change="handleSearch"
            />
            <a-select
                v-model:value="query.enabled"
                placeholder="全部状态"
                style="width: 120px"
                allow-clear
                @change="handleSearch"
            >
              <a-select-option :value="true">已启用</a-select-option>
              <a-select-option :value="false">已停用</a-select-option>
            </a-select>
            <a-button @click="handleReset">
              <template #icon>
                <ReloadOutlined/>
              </template>
              重置
            </a-button>
            <a-button type="primary" @click="openCreate">
              <template #icon>
                <PlusOutlined/>
              </template>
              新增表情
            </a-button>
          </a-space>
        </div>

        <a-table
            :columns="(columns as any)"
            :data-source="list"
            :loading="loading"
            :pagination="{
              current: query.page,
              pageSize: query.pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t: number) => `共 ${t} 个表情`
            }"
            :row-key="(r: any) => r.id"
            @change="handleTableChange"
            size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'emoji'">
              <span class="emoji-cell">{{ record.emoji }}</span>
            </template>
            <template v-if="column.key === 'category'">
              <a-tag color="blue">{{ record.category || 'default' }}</a-tag>
            </template>
            <template v-if="column.key === 'enabled'">
              <a-switch
                  :checked="record.enabled"
                  :checked-children="'启用'"
                  :un-checked-children="'停用'"
                  @change="handleToggle(record)"
              />
            </template>
            <template v-if="column.key === 'action'">
              <a-space :size="0">
                <a-button size="small" type="link" @click="openEdit(record)">编辑</a-button>
                <a-button size="small" type="link" danger @click="handleDelete(record)">删除</a-button>
              </a-space>
            </template>
          </template>
        </a-table>

        <!-- 新增 / 编辑文本表情弹窗 -->
        <a-modal
            v-model:open="modalVisible"
            :title="editingId ? '编辑表情' : '新增表情'"
            width="560px"
            :confirm-loading="saving"
            @ok="handleSave"
            ok-text="保存"
            cancel-text="取消"
        >
          <a-form layout="vertical">
            <a-form-item label="表情" required>
              <a-input
                  v-model:value="form.emoji"
                  placeholder="粘贴或从下方选择表情"
                  maxlength="16"
                  style="font-size: 20px"
              />
              <div v-if="quickEmojis.length" class="quick-emojis">
                <button
                    v-for="emoji in quickEmojis"
                    :key="emoji"
                    type="button"
                    class="quick-emoji-btn"
                    :class="{active: form.emoji === emoji}"
                    @click="pickEmoji(emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
              <div v-else class="quick-empty">暂无可用表情，请先新增</div>
            </a-form-item>
            <a-form-item label="名称">
              <a-input v-model:value="form.name" placeholder="用于搜索和备注，可留空" maxlength="100"/>
            </a-form-item>
            <a-form-item label="分类">
              <a-auto-complete
                  v-model:value="form.category"
                  placeholder="例如：default / 开心 / 难过"
                  :options="categories.map((c) => ({value: c}))"
              />
            </a-form-item>
            <a-form-item label="排序">
              <a-input-number
                  v-model:value="form.sort_order"
                  :min="0"
                  :step="1"
                  style="width: 160px"
              />
              <span class="form-tip">数字越小越靠前</span>
            </a-form-item>
            <a-form-item label="状态">
              <a-switch v-model:checked="form.enabled" :checked-children="'启用'" :un-checked-children="'停用'"/>
            </a-form-item>
          </a-form>
        </a-modal>
      </a-tab-pane>

      <a-tab-pane key="pack" tab="图片表情包">
        <div class="page-header">
          <h2>图片表情包管理</h2>
          <a-space>
            <a-input-search
                v-model:value="packQuery.keyword"
                placeholder="搜索名称 / 地址..."
                style="width: 220px"
                allow-clear
                @search="handlePackSearch"
            >
              <template #enterButton>
                <SearchOutlined/>
              </template>
            </a-input-search>
            <a-select
                v-model:value="packQuery.category"
                placeholder="全部分类"
                style="width: 130px"
                allow-clear
                :options="packCategories.map((c) => ({value: c, label: c}))"
                @change="handlePackSearch"
            />
            <a-select
                v-model:value="packQuery.enabled"
                placeholder="全部状态"
                style="width: 120px"
                allow-clear
                @change="handlePackSearch"
            >
              <a-select-option :value="true">已启用</a-select-option>
              <a-select-option :value="false">已停用</a-select-option>
            </a-select>
            <a-button @click="handlePackReset">
              <template #icon>
                <ReloadOutlined/>
              </template>
              重置
            </a-button>
            <a-button type="primary" @click="openPackCreate">
              <template #icon>
                <PlusOutlined/>
              </template>
              新增表情包
            </a-button>
          </a-space>
        </div>

        <a-table
            :columns="(packColumns as any)"
            :data-source="packList"
            :loading="packLoading"
            :pagination="{
              current: packQuery.page,
              pageSize: packQuery.pageSize,
              total: packTotal,
              showSizeChanger: true,
              showTotal: (t: number) => `共 ${t} 个表情包`
            }"
            :row-key="(r: any) => r.id"
            @change="handlePackTableChange"
            size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'category'">
              <a-tag color="purple">{{ record.category || 'default' }}</a-tag>
            </template>
            <template v-if="column.key === 'enabled'">
              <a-switch
                  :checked="record.enabled"
                  :checked-children="'启用'"
                  :un-checked-children="'停用'"
                  @change="handlePackToggle(record)"
              />
            </template>
            <template v-if="column.key === 'action'">
              <a-space :size="0">
                <a-button size="small" type="link" @click="openPackEdit(record)">编辑</a-button>
                <a-button size="small" type="link" danger @click="handlePackDelete(record)">删除</a-button>
              </a-space>
            </template>
          </template>
        </a-table>

        <!-- 新增 / 编辑表情包弹窗 -->
        <a-modal
            v-model:open="packModalVisible"
            :title="packEditingId ? '编辑表情包' : '新增表情包'"
            width="640px"
            :confirm-loading="packSaving"
            @ok="handlePackSave"
            ok-text="保存"
            cancel-text="取消"
        >
          <a-form layout="vertical">
            <a-form-item label="名称">
              <a-input v-model:value="packForm.name" placeholder="用于搜索和备注，可留空" maxlength="100"/>
            </a-form-item>
            <a-form-item label="图片" required>
              <a-input
                  v-model:value="packForm.url"
                  placeholder="支持手动输入图片链接，或从下方选择 / 上传"
                  maxlength="1000"
              />
              <div class="pack-source-row">
                <a-button @click="openMediaPicker">
                  <template #icon>
                    <PictureOutlined/>
                  </template>
                  从媒体库选择
                </a-button>
                <a-upload
                    :before-upload="handlePackUpload"
                    :show-upload-list="false"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                >
                  <a-button :loading="packUploading">
                    <template #icon>
                      <UploadOutlined/>
                    </template>
                    上传图片
                  </a-button>
                </a-upload>
              </div>
              <div class="pack-preview">
                <img v-if="packForm.url" :src="packForm.url" alt="表情包预览"/>
                <span v-else>暂无图片</span>
              </div>
              <div class="form-tip">建议图片不超过 300×300；上传时会自动压缩到 300×300 以内，插入编辑器后固定显示宽度
                100px。
              </div>
            </a-form-item>
            <a-form-item label="分类">
              <a-auto-complete
                  v-model:value="packForm.category"
                  placeholder="例如：default / 可爱 / 搞笑"
                  :options="packCategories.map((c) => ({value: c}))"
              />
            </a-form-item>
            <a-form-item label="排序">
              <a-input-number
                  v-model:value="packForm.sort_order"
                  :min="0"
                  :step="1"
                  style="width: 160px"
              />
              <span class="form-tip">数字越小越靠前</span>
            </a-form-item>
            <a-form-item label="状态">
              <a-switch v-model:checked="packForm.enabled" :checked-children="'启用'" :un-checked-children="'停用'"/>
            </a-form-item>
          </a-form>
        </a-modal>

        <!-- 媒体库选择弹窗 -->
        <a-modal
            v-model:open="mediaPickerVisible"
            title="从媒体库选择图片"
            width="720px"
            :footer="null"
        >
          <div class="media-picker-toolbar">
            <a-input-search
                v-model:value="mediaKeyword"
                placeholder="搜索文件名..."
                style="width: 220px"
                allow-clear
                @search="handleMediaSearch"
            >
              <template #enterButton>
                <SearchOutlined/>
              </template>
            </a-input-search>
          </div>
          <div v-if="mediaList.length" class="media-grid">
            <div
                v-for="item in mediaList"
                :key="item.id"
                class="media-item"
                :title="item.original_name || item.url"
                @click="selectMedia(item)"
            >
              <img :src="item.url" :alt="item.original_name || '图片'"/>
            </div>
          </div>
          <a-empty v-else-if="!mediaLoading" description="暂无图片"/>
          <div v-if="mediaTotal > 0" class="media-picker-footer">
            <a-pagination
                v-model:current="mediaPage"
                :total="mediaTotal"
                :page-size="30"
                :show-total="(t: number) => `共 ${t} 张图片`"
                @change="loadMediaImages"
            />
          </div>
        </a-modal>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
}

.emoji-cell {
  font-size: 24px;
  line-height: 1;
}

.quick-emojis {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 10px;
  max-height: 150px;
  overflow-y: auto;
  padding: 8px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.quick-emoji-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-container);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-emoji-btn:hover {
  border-color: #1677ff;
  transform: scale(1.08);
}

.quick-emoji-btn.active {
  border-color: #1677ff;
  background: rgba(22, 119, 255, 0.1);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}

.quick-empty {
  margin-top: 10px;
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-subtle);
  border: 1px dashed var(--color-border);
  border-radius: 6px;
}

.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.pack-source-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.pack-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  margin-top: 12px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-subtle);
  overflow: hidden;
}

.pack-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.pack-preview span {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.media-picker-toolbar {
  margin-bottom: 12px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
  max-height: 420px;
  overflow-y: auto;
  padding: 4px;
}

.media-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-subtle);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.media-item:hover {
  border-color: #1677ff;
  transform: scale(1.03);
}

.media-item img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.media-picker-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
