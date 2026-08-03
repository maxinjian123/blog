<script setup lang="ts">
import {computed, ref} from 'vue'
import api from '@/utils/api'
import {message} from 'ant-design-vue'
import {
  DeleteOutlined,
  ThunderboltOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'

const props = defineProps<{
  currentCover: string
  articleTitle?: string
  articleContent?: string
  articleSummary?: string
}>()

const emit = defineEmits<{
  selected: [url: string]
  cancel: []
}>()

const generatedImage = ref('')
const generating = ref(false)
const uploading = ref(false)
const uploadPreview = ref('')

const hasContext = computed(() =>
    !!(props.articleTitle?.trim() || props.articleSummary?.trim() || props.articleContent?.trim())
)

const contentPreview = computed(() => {
  const text = props.articleContent?.trim() || ''
  if (!text) return '未填写'
  return text.length > 48 ? `${text.slice(0, 48)}…` : text
})

async function handleGenerate() {
  if (!hasContext.value) {
    message.warning('请先填写文章标题或正文内容，再生成封面')
    return
  }

  generating.value = true
  const payload: Record<string, string> = {}
  if (props.articleTitle?.trim()) payload.title = props.articleTitle.trim()
  if (props.articleSummary?.trim()) payload.summary = props.articleSummary.trim()
  if (props.articleContent?.trim()) payload.content = props.articleContent.trim()

  try {
    const res: any = await api.post('/ai/cover', payload)
    const outer = res.data || res
    const data = outer.data || outer
    generatedImage.value = data.url || data.imageUrl || data
    if (!generatedImage.value) {
      message.error('生成封面失败，未返回图片')
    }
  } catch (err: any) {
    message.error(err?.response?.data?.message || '生成封面失败')
  } finally {
    generating.value = false
  }
}

async function handleUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploading.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res: any = await api.post('/upload', formData, {
      headers: {'Content-Type': 'multipart/form-data'}
    })
    const outer = res.data || res
    const data = outer.data || outer
    const url = data.url || data
    if (url) {
      uploadPreview.value = url
      message.success('上传成功')
    }
  } catch {
    message.error('上传失败')
  } finally {
    uploading.value = false
    target.value = ''
  }
}

function handleSelectImage(url: string) {
  emit('selected', url)
}

function handleRemoveCover() {
  emit('selected', '')
}

function triggerUpload() {
  const input = document.getElementById('cover-upload-input') as HTMLInputElement
  input?.click()
}
</script>

<template>
  <div>
    <a-tabs>
      <a-tab-pane key="upload" tab="上传封面">
        <div style="padding: 16px 0">
          <div
              class="cover-upload"
              style="width: 100%; height: 200px; margin-bottom: 16px"
              @click="triggerUpload"
          >
            <img
                v-if="uploadPreview || props.currentCover"
                :src="uploadPreview || props.currentCover"
                alt="cover"
                class="cover-upload-img"
            />
            <div v-else class="cover-upload-placeholder">
              <UploadOutlined style="font-size: 32px"/>
              <span>点击上传封面</span>
            </div>
          </div>
          <input
              id="cover-upload-input"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleUpload"
          />

          <div style="display: flex; gap: 8px">
            <a-button
                v-if="uploadPreview"
                type="primary"
                block
                @click="handleSelectImage(uploadPreview)"
            >
              使用此图片
            </a-button>
            <a-button
                v-if="props.currentCover"
                block
                danger
                @click="handleRemoveCover"
            >
              <template #icon><DeleteOutlined/></template>
              移除封面
            </a-button>
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="ai" tab="AI 生成封面">
        <div style="padding: 16px 0">
          <a-alert
              type="info"
              show-icon
              style="margin-bottom: 12px"
              message="提取文章内容生成封面"
              description="无需手动描述，系统将根据文章标题、摘要和正文自动提取主题关键词生成封面。"
          />

          <div class="context-card">
            <div class="context-item" :class="{muted: !props.articleTitle}">
              <span class="context-label">标题</span>
              <span class="context-value">{{ props.articleTitle || '未填写' }}</span>
            </div>
            <div class="context-item" :class="{muted: !props.articleSummary}">
              <span class="context-label">摘要</span>
              <span class="context-value">{{ props.articleSummary || '未填写' }}</span>
            </div>
            <div class="context-item" :class="{muted: !props.articleContent}">
              <span class="context-label">正文</span>
              <span class="context-value">{{ contentPreview }}</span>
            </div>
          </div>

          <a-button
              type="primary"
              block
              :loading="generating"
              @click="handleGenerate"
          >
            <template #icon><ThunderboltOutlined/></template>
            AI 生成封面
          </a-button>

          <div
              v-if="generating"
              style="text-align: center; padding: 32px 0"
          >
            <a-spin/>
            <div style="margin-top: 12px; color: rgba(0, 0, 0, 0.45)">
              AI 正在根据文章内容生成封面，请稍候…
            </div>
          </div>

          <div v-if="generatedImage && !generating" style="margin-top: 16px">
            <img
                :src="generatedImage"
                alt="AI生成封面"
                style="width: 100%; border-radius: 8px; margin-bottom: 12px"
            />
            <a-button type="primary" block @click="handleSelectImage(generatedImage)">
              设为封面
            </a-button>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style scoped>
.cover-upload-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.context-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.context-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.context-item.muted {
  opacity: 0.55;
}

.context-label {
  flex: none;
  width: 32px;
  color: var(--color-text-secondary);
}

.context-value {
  min-width: 0;
  color: var(--color-text);
  word-break: break-all;
}
</style>
