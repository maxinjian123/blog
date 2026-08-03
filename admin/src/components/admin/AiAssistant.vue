<script setup lang="ts">
import {computed, ref} from 'vue'
import api from '@/utils/api'
import {message} from 'ant-design-vue'
import {sanitizeHtml} from '@/utils/sanitize'
import {
  CloseOutlined,
  CopyOutlined,
  EditOutlined,
  FileTextOutlined,
  ReloadOutlined,
  RobotOutlined,
  SendOutlined,
  TagsOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{
  editorContent: string
  contentType?: string
}>()

const emit = defineEmits<{
  result: [content: string]
  insert: [content: string]
  tagsGenerated: [tags: Array<{id: string; name: string; slug: string}>]
}>()

const prompt = ref('')
const style = ref('专业博客文章')
const length = ref('中等')
const result = ref('')
const loading = ref(false)
const currentAction = ref('')
const tagsResult = ref<string[]>([])

const styleOptions = [
  {value: '专业博客文章', label: '专业博客文章'},
  {value: '技术教程', label: '技术教程'},
  {value: '经验分享', label: '经验分享'},
  {value: '深度分析', label: '深度分析'},
  {value: '轻松随笔', label: '轻松随笔'},
  {value: '产品介绍', label: '产品介绍'},
]

const lengthOptions = [
  {value: '简短', label: '简短 · 约 500 字'},
  {value: '中等', label: '中等 · 约 1200 字'},
  {value: '详细', label: '详细 · 约 2000 字'},
]

const formatLabel = computed(() => (props.contentType === 'markdown' ? 'Markdown' : 'HTML'))
const hasEditorContent = computed(() => !!props.editorContent.trim())

async function callAi(endpoint: string, payload: Record<string, any>) {
  loading.value = true
  try {
    const res: any = await api.post(endpoint, payload)
    const outer = res.data || res
    const data = outer.data || outer
    result.value =
        data.content ||
        data.summary ||
        data.polished ||
        data.continuation ||
        JSON.stringify(data, null, 2)
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
    message.warning('请描述你想创作的文章主题或内容')
    return
  }
  currentAction.value = '创作文章'
  const payload: Record<string, any> = {
    prompt: prompt.value,
    content_type: props.contentType || 'html',
  }
  if (style.value.trim()) payload.style = style.value.trim()
  if (length.value.trim()) payload.length = length.value.trim()
  await callAi('/ai/write', payload)
}

async function handlePolish() {
  if (!hasEditorContent.value) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  currentAction.value = '润色'
  await callAi('/ai/polish', {
    content: props.editorContent,
    content_type: props.contentType || 'html',
  })
}

async function handleContinue() {
  if (!hasEditorContent.value) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  currentAction.value = '续写'
  await callAi('/ai/continue', {
    content: props.editorContent,
    direction: prompt.value || '',
    content_type: props.contentType || 'html',
  })
}

async function handleSummary() {
  if (!hasEditorContent.value) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  currentAction.value = '生成摘要'
  await callAi('/ai/summary', {
    content: props.editorContent,
  })
}

async function handleAutoTags() {
  if (!hasEditorContent.value) {
    message.warning('请先在编辑器中输入内容')
    return
  }
  currentAction.value = '自动标签'
  await callAi('/ai/tags', {
    content: props.editorContent,
    title: props.editorContent.split('\n')[0]?.slice(0, 100) || '',
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

function clearResult() {
  result.value = ''
  tagsResult.value = []
}
</script>

<template>
  <div class="ai-assistant">
    <!-- 头部 -->
    <div class="ai-header">
      <div class="ai-header-title">
        <ThunderboltOutlined class="ai-header-icon"/>
        <span>AI 写作助手</span>
      </div>
      <a-tag color="processing" class="format-tag">输出格式：{{ formatLabel }}</a-tag>
    </div>
    <p class="ai-subtitle">围绕当前文章内容智能创作、润色与提炼</p>

    <!-- 创作文章 -->
    <section class="ai-section">
      <h4 class="section-title"><EditOutlined/> 创作文章</h4>
      <a-textarea
          v-model:value="prompt"
          :rows="3"
          maxlength="500"
          show-count
          placeholder="描述你想创作的文章主题，例如：写一篇关于 Vue 3 响应式原理的入门教程…"
          class="prompt-input"
      />
      <div class="param-grid">
        <div class="param-item">
          <label class="param-label">写作风格</label>
          <a-auto-complete
              v-model:value="style"
              :options="styleOptions"
              size="small"
              class="param-select"
              placeholder="选择或输入写作风格"
              :show-action="['click', 'focus']"
          />
        </div>
        <div class="param-item">
          <label class="param-label">篇幅长度</label>
          <a-auto-complete
              v-model:value="length"
              :options="lengthOptions"
              size="small"
              class="param-select"
              placeholder="篇幅长度，如：3000 字"
              :show-action="['click', 'focus']"
          />
        </div>
      </div>
      <p class="param-hint">写作风格与篇幅支持自定义输入，例如：幽默风趣 / 约 3000 字</p>
      <a-button
          type="primary"
          block
          class="write-btn"
          :loading="loading && currentAction === '创作文章'"
          @click="handleWriteArticle"
      >
        <template #icon><SendOutlined/></template>
        AI 创作文章
      </a-button>
    </section>

    <a-divider class="ai-divider"/>

    <!-- 快捷工具 -->
    <section class="ai-section">
      <h4 class="section-title"><ToolOutlined/> 快捷工具</h4>
      <div class="tool-grid">
        <a-button
            class="tool-btn"
            :loading="loading && currentAction === '润色'"
            @click="handlePolish"
        >
          <template #icon><ThunderboltOutlined/></template>
          润色
        </a-button>
        <a-button
            class="tool-btn"
            :loading="loading && currentAction === '续写'"
            @click="handleContinue"
        >
          <template #icon><ReloadOutlined/></template>
          续写
        </a-button>
        <a-button
            class="tool-btn"
            :loading="loading && currentAction === '生成摘要'"
            @click="handleSummary"
        >
          <template #icon><FileTextOutlined/></template>
          生成摘要
        </a-button>
        <a-button
            class="tool-btn"
            :loading="loading && currentAction === '自动标签'"
            @click="handleAutoTags"
        >
          <template #icon><TagsOutlined/></template>
          自动标签
        </a-button>
      </div>
      <p v-if="!hasEditorContent" class="tool-hint">润色、续写等工具需要先在编辑器中输入内容</p>
    </section>

    <!-- 推荐标签 -->
    <div v-if="tagsResult.length > 0" class="tags-panel">
      <div class="tags-panel-title">推荐标签</div>
      <a-space wrap :size="6">
        <a-tag v-for="tag in tagsResult" :key="tag" color="blue">{{ tag }}</a-tag>
      </a-space>
    </div>

    <!-- 结果区 -->
    <section v-if="loading || result" class="result-section">
      <div v-if="loading" class="result-loading">
        <a-spin size="small"/>
        <span>正在{{ currentAction }}，请稍候…</span>
      </div>
      <template v-else>
        <div class="result-head">
          <span class="result-title"><RobotOutlined/> 生成结果</span>
          <a-button type="text" size="small" class="result-clear" @click="clearResult">
            <CloseOutlined/>
            清空
          </a-button>
        </div>
        <div class="ai-result" v-html="sanitizeHtml(result)"></div>
        <div class="result-actions">
          <a-button size="small" type="primary" @click="handleInsert">
            <template #icon><SendOutlined/></template>
            插入编辑器
          </a-button>
          <a-button size="small" @click="handleCopy">
            <template #icon><CopyOutlined/></template>
            复制
          </a-button>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.ai-assistant {
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: var(--color-text);
}

/* ===== 头部 ===== */
.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ai-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.ai-header-icon {
  color: #1677ff;
}

.format-tag {
  margin-inline-end: 0;
  border-radius: 999px;
}

.ai-subtitle {
  margin: -10px 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* ===== 区块 ===== */
.ai-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.section-title .anticon {
  color: #1677ff;
}

.ai-divider {
  margin: 0;
}

/* ===== 创作参数 ===== */
.prompt-input {
  font-size: 13px;
}

.param-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.param-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.param-select {
  width: 100%;
}

.param-hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-disabled);
}

.write-btn {
  font-weight: 500;
}

/* ===== 快捷工具 ===== */
.tool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
}

.tool-hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-disabled);
}

/* ===== 推荐标签 ===== */
.tags-panel {
  padding: 10px 12px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.tags-panel-title {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary);
}

/* ===== 结果区 ===== */
.result-section {
  border-top: 1px dashed var(--color-border);
  padding-top: 14px;
}

.result-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.result-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.result-title .anticon {
  color: #1677ff;
}

.result-clear {
  color: var(--color-text-tertiary);
}

.ai-result {
  background: var(--color-bg-container);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  min-height: 60px;
  max-height: 360px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

.result-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>
