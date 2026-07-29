<script setup lang="ts">
import {ref, watch} from 'vue'
import api from '@/utils/api'
import {message} from 'ant-design-vue'
import {sanitizeHtml} from '@/utils/sanitize'
import {
  CopyOutlined,
  EditOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SendOutlined,
  TagsOutlined,
  ThunderboltOutlined
} from '@ant-design/icons-vue'

const content = ref('')
const props = defineProps<{
  editorContent: string
  contentType?: string
}>()
watch(() => props.editorContent, (value) => {
  content.value = value
}, {
  deep: true
})
const emit = defineEmits<{
  result: [content: string]
  insert: [content: string]
  tagsGenerated: [tags: Array<{ id: string; name: string; slug: string }>]
}>()

const prompt = ref('')
const result = ref('')
const loading = ref(false)
const currentAction = ref('')
const tagsResult = ref<string[]>([])

async function callAi(endpoint: string, payload: Record<string, any>) {
  loading.value = true
  try {
    const res: any = await api.post(endpoint, payload)
    const outer = res.data || res
    const data = outer.data || outer
    result.value = data.content || JSON.stringify(data, null, 2)
    emit('result', result.value)

    if (endpoint === '/ai/tags' && (data.tags || data.result)) {
      const tags = data.tags || data.result || []
      tagsResult.value = Array.isArray(tags) ? tags : []
      const tagObjects = data.tagObjects || []
      if (tagObjects.length > 0) {
        emit('tagsGenerated', tagObjects)
      }
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'AI 请求失败'
    message.error(msg)
  } finally {
    loading.value = false
  }
}

async function handleWriteArticle() {
  if (!prompt.value.trim()) {
    message.warning('请描述你想要创作的文章主题或内容')
    return
  }
  currentAction.value = '创作文章'
  await callAi('/ai/write', {
    prompt: prompt.value,
    content: props.editorContent,
    content_type: props.contentType || 'html'
  })
}

async function handlePolish() {
  if (!props.editorContent.trim()) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  currentAction.value = '润色'
  await callAi('/ai/polish', {
    content: props.editorContent,
    instruction: prompt.value || '请润色优化以下内容',
    content_type: props.contentType || 'html'
  })
}

async function handleContinue() {
  if (!props.editorContent.trim()) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  currentAction.value = '续写'
  await callAi('/ai/continue', {
    content: content.value,
    direction: prompt.value || '',
    content_type: props.contentType || 'html'
  })
}

async function handleSummary() {
  if (!content) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  currentAction.value = '生成摘要'
  await callAi('/ai/summary', {
    content: content.value
  })
}

async function handleAutoTags() {
  if (!props.editorContent.trim()) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  currentAction.value = '自动标签'
  await callAi('/ai/tags', {
    content: props.editorContent,
    title: content.value.split('\n')[0]?.slice(0, 100) || ''
  })
}

function handleInsert() {
  emit('insert', result.value)
  message.success('已插入到编辑器')
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(result.value)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败')
  }
}
</script>

<template>
  <div class="ai-sidebar">
    <h4>
      <ThunderboltOutlined style="color: #1677ff; margin-right: 6px"/>
      AI 写作助手
    </h4>

    <a-textarea
        v-model:value="prompt"
        placeholder="输入AI指令，例如：写一篇关于AI未来的文章..."
        :rows="3"
        style="margin-bottom: 12px"
    />

    <div class="ai-btn-group">
      <a-button
          size="small"
          type="primary"
          :loading="loading && currentAction === '创作文章'"
          @click="handleWriteArticle"
      >
        <template #icon>
          <EditOutlined/>
        </template>
        创作文章
      </a-button>
      <a-button
          size="small"
          :loading="loading && currentAction === '润色'"
          @click="handlePolish"
      >
        <template #icon>
          <ThunderboltOutlined/>
        </template>
        润色
      </a-button>
      <a-button
          size="small"
          :loading="loading && currentAction === '续写'"
          @click="handleContinue"
      >
        <template #icon>
          <ReloadOutlined/>
        </template>
        续写
      </a-button>
      <a-button
          size="small"
          :loading="loading && currentAction === '生成摘要'"
          @click="handleSummary"
      >
        <template #icon>
          <FileTextOutlined/>
        </template>
        生成摘要
      </a-button>
      <a-button
          size="small"
          :loading="loading && currentAction === '自动标签'"
          @click="handleAutoTags"
      >
        <template #icon>
          <TagsOutlined/>
        </template>
        自动标签
      </a-button>
    </div>

    <div v-if="tagsResult.length > 0" style="margin-bottom: 12px">
      <div style="font-size: 13px; color: rgba(0,0,0,0.65); margin-bottom: 6px">
        推荐标签：
      </div>
      <a-space wrap>
        <a-tag
            v-for="tag in tagsResult"
            :key="tag"
            color="blue"
            style="cursor: pointer"
        >
          {{ tag }}
        </a-tag>
      </a-space>
    </div>

    <div v-if="loading" style="text-align: center; padding: 24px">
      <a-spin/>
      <div style="margin-top: 8px; color: rgba(0,0,0,0.45)">
        正在{{ currentAction }}...
      </div>
    </div>

    <div v-if="result && !loading && tagsResult.length === 0" class="ai-result">
      <div v-html="sanitizeHtml(result)"></div>

      <div style="margin-top: 12px; display: flex; gap: 8px">
        <a-button size="small" type="primary" @click="handleInsert">
          <template #icon>
            <SendOutlined/>
          </template>
          插入编辑器
        </a-button>
        <a-button size="small" @click="handleCopy">
          <template #icon>
            <CopyOutlined/>
          </template>
          复制
        </a-button>
      </div>
    </div>
  </div>
</template>