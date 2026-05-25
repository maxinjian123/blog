<script setup lang="ts">
import { ref } from 'vue'
import api from '@/utils/api'
import { message } from 'ant-design-vue'
import {
  PictureOutlined,
  UploadOutlined,
  ThunderboltOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

const props = defineProps<{
  currentCover: string
}>()

const emit = defineEmits<{
  selected: [url: string]
  cancel: []
}>()

const prompt = ref('')
const generatedImage = ref('')
const generating = ref(false)
const uploading = ref(false)
const uploadPreview = ref('')

async function handleGenerate() {
  if (!prompt.value.trim()) {
    message.warning('请输入封面描述')
    return
  }
  generating.value = true
  try {
    const res: any = await api.post('/ai/cover', {
      prompt: prompt.value
    })
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
      headers: { 'Content-Type': 'multipart/form-data' }
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
              <UploadOutlined style="font-size: 32px" />
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
              <template #icon><DeleteOutlined /></template>
              移除封面
            </a-button>
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="ai" tab="AI 生成封面">
        <div style="padding: 16px 0">
          <a-textarea
            v-model:value="prompt"
            placeholder="描述你想要的封面画面，例如：赛博朋克风格的城市夜景，霓虹灯蓝色和紫色...
            或选择预设风格："
            :rows="3"
            style="margin-bottom: 12px"
          />

          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px">
            <a-tag
              v-for="preset in ['赛博朋克', '极简科技', '自然风光', '抽象艺术', '暗黑风格', '渐变光影']"
              :key="preset"
              style="cursor: pointer"
              @click="prompt = preset + (prompt ? ' ' + prompt : '')"
            >
              {{ preset }}
            </a-tag>
          </div>

          <a-button
            type="primary"
            block
            :loading="generating"
            @click="handleGenerate"
          >
            <template #icon><ThunderboltOutlined /></template>
            AI 生成封面
          </a-button>

          <div
            v-if="generating"
            style="text-align: center; padding: 32px 0"
          >
            <a-spin />
            <div style="margin-top: 12px; color: rgba(0,0,0,0.45)">
              AI 正在生成封面，请稍候...
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
</style>