<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '@/utils/api'
import { message } from 'ant-design-vue'
import { UploadOutlined, InboxOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  open: boolean
  minioEnabled: boolean
  defaultStorage: 'local' | 'minio'
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  uploaded: []
}>()

const uploadStorage = ref<'local' | 'minio'>('local')
const fileList = ref<any[]>([])
const uploading = ref(false)

// 打开时同步默认存储源
watch(() => props.open, (v) => {
  if (v) {
    uploadStorage.value = props.defaultStorage
    fileList.value = []
  }
})

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

async function handleStartUpload() {
  if (fileList.value.length === 0) {
    message.warning('请先选择文件')
    return
  }
  if (uploadStorage.value === 'minio' && !props.minioEnabled) {
    message.error('MinIO 未启用，无法上传')
    return
  }

  uploading.value = true
  let successCount = 0
  let failCount = 0
  const failedFiles: string[] = []

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

  fileList.value = []
  if (successCount > 0) {
    emit('uploaded')
    emit('update:open', false)
  }
}

function handleClose() {
  emit('update:open', false)
  fileList.value = []
}
</script>

<template>
  <a-drawer
    :open="open"
    title="上传文件"
    placement="right"
    width="500"
    @close="handleClose"
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
        <p>
          已选择上传源：
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
          <a-button @click="handleClose">取消</a-button>
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
</template>

<style scoped>
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
  color: var(--color-text-tertiary);
}

.upload-tip .info {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin: 4px 0 0;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
</style>
