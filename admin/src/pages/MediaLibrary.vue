<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/utils/api'
import { message, Modal } from 'ant-design-vue'
import {
  UploadOutlined,
  DeleteOutlined,
  CopyOutlined,
  EditOutlined,
  FileOutlined,
  CloudOutlined,
  HddOutlined,
  EyeOutlined,
  ReloadOutlined,
  InboxOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'

interface MediaItem {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  storage: 'local' | 'minio'
  url: string
  path: string
  created_at: string
}

const list = ref<MediaItem[]>([])
const loading = ref(false)
const uploading = ref(false)

const query = reactive({
  page: 1,
  pageSize: 24,
  storage: '' as '' | 'local' | 'minio',
  keyword: ''
})

const total = ref(0)
const stats = ref({ local: 0, minio: 0, total: 0 })

// 预览
const previewVisible = ref(false)
const previewItem = ref<MediaItem | null>(null)

// 重命名
const renameVisible = ref(false)
const renameLoading = ref(false)
const renameForm = reactive({ id: '', original_name: '' })

// 上传
const uploadDrawerVisible = ref(false)
const uploadStorage = ref<'local' | 'minio'>('local')
const fileList = ref<any[]>([])
const minioEnabled = ref(false)

// 是否为图片
function isImage(mime: string): boolean {
  return mime?.startsWith('image/') || false
}

// 文件大小格式化
function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

// 文件图标颜色
function fileIconColor(mime: string): string {
  if (mime?.startsWith('image/')) return '#52c41a'
  if (mime?.startsWith('video/')) return '#722ed1'
  if (mime?.startsWith('application/pdf')) return '#ff4d4f'
  return '#1677ff'
}

// 上传源标签
const storageTabs = computed(() => [
  { key: '', label: '全部', count: stats.value.total, icon: FileOutlined },
  { key: 'local', label: '本地', count: stats.value.local, icon: HddOutlined },
  { key: 'minio', label: 'MinIO', count: stats.value.minio, icon: CloudOutlined, disabled: !minioEnabled.value }
])

async function fetchList() {
  loading.value = true
  try {
    const res: any = await api.get('/media', {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        storage: query.storage || undefined,
        keyword: query.keyword || undefined
      }
    })
    const data = res.data || res
    list.value = data?.list || []
    total.value = data?.pagination?.total ?? data?.total ?? 0
    if (data?.stats) {
      stats.value = data.stats
    }
  } catch (err) {
    console.error('获取媒体列表失败:', err)
  } finally {
    loading.value = false
  }
}

async function fetchUploadConfig() {
  try {
    const res: any = await api.get('/admin/settings')
    const grouped = res.data || res || {}
    const upload = grouped.upload || {}
    minioEnabled.value = upload.minio_enabled?.value === 'true'
    uploadStorage.value = upload.upload_default_storage?.value === 'minio' && minioEnabled.value
      ? 'minio'
      : 'local'
  } catch {
    // 忽略
  }
}

function handleStorageChange(key: string) {
  query.storage = key as '' | 'local' | 'minio'
  query.page = 1
  fetchList()
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handlePageChange(page: number, pageSize: number) {
  query.page = page
  query.pageSize = pageSize
  fetchList()
}

// 上传前校验：返回 false 阻止自动上传，文件仅添加到列表，由"开始上传"按钮统一处理
function beforeUpload(file: File) {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'text/markdown', 'text/plain',
    'video/mp4', 'video/webm', 'video/ogg', 'video/x-msvideo', 'video/quicktime'
  ]
  if (!allowed.includes(file.type)) {
    message.error(`不支持的文件类型：${file.type}`)
    return false
  }
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    message.error('文件大小不能超过 10MB')
    return false
  }
  return false
}

// 批量上传：点击"开始上传"按钮时调用
async function handleStartUpload() {
  if (fileList.value.length === 0) {
    message.warning('请先选择文件')
    return
  }
  if (uploadStorage.value === 'minio' && !minioEnabled.value) {
    message.error('MinIO 未启用，无法上传')
    return
  }

  uploading.value = true
  let successCount = 0
  let failCount = 0
  const failedFiles: string[] = []

  // 串行上传，避免并发过多
  for (const file of fileList.value) {
    const raw = (file as any).originFileObj || file
    try {
      const formData = new FormData()
      formData.append('file', raw as File)
      formData.append('storage', uploadStorage.value)
      await api.post('/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      successCount++
      ;(file as any).status = 'done'
    } catch (err) {
      failCount++
      failedFiles.push((file as any).name || '未知文件')
      ;(file as any).status = 'error'
    }
  }

  uploading.value = false

  if (successCount > 0) {
    message.success(`成功上传 ${successCount} 个文件`)
  }
  if (failCount > 0) {
    message.error(`${failCount} 个文件上传失败：${failedFiles.join(', ')}`)
  }

  // 上传完成后清空列表并刷新
  fileList.value = []
  if (successCount > 0) {
    await fetchList()
  }
}

function handleUploadDrawerOpen() {
  uploadDrawerVisible.value = true
  fileList.value = []
}

function handleUploadDrawerClose() {
  uploadDrawerVisible.value = false
  fileList.value = []
}

// 预览
function handlePreview(item: MediaItem) {
  previewItem.value = item
  previewVisible.value = true
}

// 复制链接
async function handleCopyUrl(item: MediaItem) {
  // 本地文件需要拼上后端基址
  let url = item.url
  if (item.storage === 'local' && url.startsWith('/uploads/')) {
    url = `${window.location.origin}${url}`
  }
  try {
    await navigator.clipboard.writeText(url)
    message.success('链接已复制')
  } catch {
    // 降级方案
    const input = document.createElement('textarea')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    message.success('链接已复制')
  }
}

// 重命名
function handleRename(item: MediaItem) {
  renameForm.id = item.id
  renameForm.original_name = item.original_name
  renameVisible.value = true
}

async function handleRenameSubmit() {
  if (!renameForm.original_name?.trim()) {
    message.warning('请输入文件名')
    return
  }
  renameLoading.value = true
  try {
    await api.put(`/media/${renameForm.id}`, { original_name: renameForm.original_name })
    message.success('已重命名')
    renameVisible.value = false
    await fetchList()
  } catch {
    message.error('重命名失败')
  } finally {
    renameLoading.value = false
  }
}

// 删除
function handleDelete(item: MediaItem) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除文件「${item.original_name}」吗？此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await api.delete(`/media/${item.id}`)
        message.success('文件已删除')
        await fetchList()
      } catch {
        message.error('删除失败')
      }
    }
  })
}

onMounted(() => {
  fetchUploadConfig()
  fetchList()
})
</script>

<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center">
      <h2>媒体库</h2>
      <a-space>
        <a-button @click="fetchList">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
        <a-button type="primary" @click="handleUploadDrawerOpen">
          <template #icon><UploadOutlined /></template>
          上传文件
        </a-button>
      </a-space>
    </div>

    <!-- 上传源切换 -->
    <div class="storage-tabs">
      <div
        v-for="tab in storageTabs"
        :key="tab.key"
        class="storage-tab"
        :class="{ active: query.storage === tab.key, disabled: tab.disabled }"
        @click="!tab.disabled && handleStorageChange(tab.key)"
      >
        <component :is="tab.icon" />
        <span class="label">{{ tab.label }}</span>
        <a-badge :count="tab.count" :number-style="{ backgroundColor: '#1677ff' }" :overflow-count="9999" />
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <a-input-search
        v-model:value="query.keyword"
        placeholder="搜索文件名"
        allow-clear
        style="max-width: 300px"
        @search="handleSearch"
      />
    </div>

    <a-spin :spinning="loading">
      <!-- 文件网格 -->
      <div v-if="list.length > 0" class="media-grid">
        <div v-for="item in list" :key="item.id" class="media-card">
          <div class="media-preview" @click="handlePreview(item)">
            <img v-if="isImage(item.mime_type)" :src="item.url" :alt="item.original_name" />
            <div v-else class="file-placeholder">
              <FileOutlined :style="{ color: fileIconColor(item.mime_type), fontSize: '48px' }" />
              <div class="file-ext">{{ item.original_name.split('.').pop()?.toUpperCase() || 'FILE' }}</div>
            </div>
            <div class="media-overlay">
              <EyeOutlined />
            </div>
          </div>
          <div class="media-info">
            <div class="media-name" :title="item.original_name">{{ item.original_name }}</div>
            <div class="media-meta">
              <a-tag :color="item.storage === 'minio' ? 'purple' : 'blue'" style="margin: 0">
                {{ item.storage === 'minio' ? 'MinIO' : '本地' }}
              </a-tag>
              <span class="media-size">{{ formatSize(item.size) }}</span>
            </div>
            <div class="media-date">{{ dayjs(item.created_at).format('YYYY-MM-DD HH:mm') }}</div>
          </div>
          <div class="media-actions">
            <a-tooltip title="复制链接">
              <a-button type="text" size="small" @click="handleCopyUrl(item)">
                <CopyOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="重命名">
              <a-button type="text" size="small" @click="handleRename(item)">
                <EditOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="删除">
              <a-button type="text" size="small" danger @click="handleDelete(item)">
                <DeleteOutlined />
              </a-button>
            </a-tooltip>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <a-empty v-else description="暂无文件，点击右上角上传" style="padding: 60px 0" />

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-wrapper">
        <a-pagination
          v-model:current="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-size-options="['12', '24', '48', '96']"
          :show-size-changer="true"
          :show-quick-jumper="true"
          :show-total="(t: number) => `共 ${t} 个文件`"
          @change="handlePageChange"
        />
      </div>
    </a-spin>

    <!-- 预览弹窗 -->
    <a-modal
      v-model:open="previewVisible"
      :title="previewItem?.original_name"
      :footer="null"
      width="800px"
    >
      <div v-if="previewItem" class="preview-content">
        <div v-if="isImage(previewItem.mime_type)" class="preview-image-wrapper">
          <img :src="previewItem.url" :alt="previewItem.original_name" />
        </div>
        <div v-else class="preview-file-wrapper">
          <FileOutlined :style="{ color: fileIconColor(previewItem.mime_type), fontSize: '80px' }" />
          <p>该文件类型不支持预览</p>
          <a :href="previewItem.url" target="_blank">下载文件</a>
        </div>
        <a-descriptions :column="2" bordered size="small" style="margin-top: 16px">
          <a-descriptions-item label="文件名" :span="2">{{ previewItem.original_name }}</a-descriptions-item>
          <a-descriptions-item label="存储名">{{ previewItem.filename }}</a-descriptions-item>
          <a-descriptions-item label="类型">{{ previewItem.mime_type }}</a-descriptions-item>
          <a-descriptions-item label="大小">{{ formatSize(previewItem.size) }}</a-descriptions-item>
          <a-descriptions-item label="存储源">
            <a-tag :color="previewItem.storage === 'minio' ? 'purple' : 'blue'">
              {{ previewItem.storage === 'minio' ? 'MinIO' : '本地' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="上传时间" :span="2">
            {{ dayjs(previewItem.created_at).format('YYYY-MM-DD HH:mm:ss') }}
          </a-descriptions-item>
          <a-descriptions-item label="访问 URL" :span="2">
            <a-typography-link
              :href="previewItem.url"
              target="_blank"
              :copyable="{ text: previewItem.url }"
              style="word-break: break-all"
            >
              {{ previewItem.url }}
            </a-typography-link>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>

    <!-- 重命名弹窗 -->
    <a-modal
      v-model:open="renameVisible"
      title="重命名文件"
      :confirm-loading="renameLoading"
      @ok="handleRenameSubmit"
    >
      <a-form layout="vertical">
        <a-form-item label="文件名">
          <a-input v-model:value="renameForm.original_name" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 上传抽屉 -->
    <a-drawer
      v-model:open="uploadDrawerVisible"
      title="上传文件"
      placement="right"
      width="500"
      @close="handleUploadDrawerClose"
    >
      <div class="upload-drawer">
        <div class="upload-source-select">
          <div class="label">选择上传源：</div>
          <a-radio-group v-model:value="uploadStorage">
            <a-radio value="local">本地存储</a-radio>
            <a-radio value="minio" :disabled="!minioEnabled">MinIO 对象存储</a-radio>
          </a-radio-group>
          <div v-if="!minioEnabled" class="hint">
            MinIO 未启用，可在 <router-link to="/settings">系统设置 - 上传配置</router-link> 中开启
          </div>
        </div>

        <a-upload-dragger
          v-model:file-list="fileList"
          :multiple="true"
          :before-upload="beforeUpload"
          list-type="picture"
        >
          <p class="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p class="ant-upload-text">点击或拖拽文件到此处添加</p>
          <p class="ant-upload-hint">支持图片、PDF、Markdown、视频等，单文件最大 10MB</p>
        </a-upload-dragger>

        <div class="upload-tip">
          <p>已选择上传源：
            <a-tag :color="uploadStorage === 'minio' ? 'purple' : 'blue'">
              {{ uploadStorage === 'minio' ? 'MinIO 对象存储' : '本地存储' }}
            </a-tag>
          </p>
          <p v-if="uploadStorage === 'minio'" class="info">
            文件将上传到 MinIO 服务器，可通过公网 URL 访问
          </p>
          <p v-else class="info">
            文件将上传到服务器本地目录，通过 /uploads/ 路径访问
          </p>
        </div>

        <div class="upload-actions">
          <a-space>
            <a-button @click="handleUploadDrawerClose">取消</a-button>
            <a-button
              type="primary"
              :loading="uploading"
              :disabled="fileList.length === 0"
              @click="handleStartUpload"
            >
              <template #icon><UploadOutlined /></template>
              开始上传 ({{ fileList.length }})
            </a-button>
          </a-space>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.storage-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.storage-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.storage-tab:hover:not(.disabled) {
  border-color: #1677ff;
  color: #1677ff;
}

.storage-tab.active {
  background: #e6f4ff;
  border-color: #1677ff;
  color: #1677ff;
}

.storage-tab.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.storage-tab .label {
  font-size: 14px;
}

.search-bar {
  margin-bottom: 16px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.media-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s;
}

.media-card:hover {
  border-color: #1677ff;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.12);
}

.media-preview {
  position: relative;
  width: 100%;
  height: 160px;
  background: #f5f5f5;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.file-ext {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 600;
}

.media-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  opacity: 0;
  transition: opacity 0.2s;
}

.media-preview:hover .media-overlay {
  opacity: 1;
}

.media-info {
  padding: 10px 12px;
}

.media-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}

.media-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.media-size {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.media-date {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.35);
}

.media-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #f0f0f0;
  padding: 4px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.preview-content {
  text-align: center;
}

.preview-image-wrapper {
  max-height: 500px;
  overflow: auto;
  display: flex;
  justify-content: center;
}

.preview-image-wrapper img {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
}

.preview-file-wrapper {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.upload-drawer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-source-select .label {
  margin-bottom: 8px;
  font-weight: 500;
}

.upload-source-select .hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.upload-tip .info {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin: 4px 0 0;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
</style>
