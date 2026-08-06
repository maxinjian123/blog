<script setup lang="ts">
import { computed } from 'vue'
import { SearchOutlined, ImportOutlined, GlobalOutlined } from '@ant-design/icons-vue'
import type { ArticlePlatformId, ArticlePlatform, Category } from '@/composables/useArticleCrawler'

const props = defineProps<{
  platforms: ArticlePlatform[]
  currentPlatform: ArticlePlatformId
  keyword: string
  rssUrl: string
  isRss: boolean
  loading: boolean
  importing: boolean
  selectedCount: number
  categories: Category[]
  categoryId: string
  autoSummary: boolean
  autoTags: boolean
}>()

const emit = defineEmits<{
  (e: 'update:currentPlatform', v: ArticlePlatformId): void
  (e: 'update:keyword', v: string): void
  (e: 'update:rssUrl', v: string): void
  (e: 'update:categoryId', v: string): void
  (e: 'update:autoSummary', v: boolean): void
  (e: 'update:autoTags', v: boolean): void
  (e: 'platform-change'): void
  (e: 'search'): void
  (e: 'import'): void
}>()

const currentPlatformId = computed({
  get: () => props.currentPlatform,
  set: (v: ArticlePlatformId) => emit('update:currentPlatform', v)
})
const keywordModel = computed({
  get: () => props.keyword,
  set: (v: string) => emit('update:keyword', v)
})
const rssUrlModel = computed({
  get: () => props.rssUrl,
  set: (v: string) => emit('update:rssUrl', v)
})
const categoryIdModel = computed({
  get: () => props.categoryId,
  set: (v: string) => emit('update:categoryId', v)
})
const autoSummaryModel = computed({
  get: () => props.autoSummary,
  set: (v: boolean) => emit('update:autoSummary', v)
})
const autoTagsModel = computed({
  get: () => props.autoTags,
  set: (v: boolean) => emit('update:autoTags', v)
})

// 当前平台是否受限（反爬/需验证码），给出提示
const currentPlatformUnstable = computed(() => {
  const p = props.platforms.find(it => it.id === props.currentPlatform)
  return !!p?.unstable
})

// a-radio-group 的 change 事件参数是 RadioChangeEvent，需从 e.target.value 取值
function onPlatformChange(e: any) {
  const val = e?.target?.value as ArticlePlatformId
  if (val) {
    currentPlatformId.value = val
    emit('platform-change')
  }
}
</script>

<template>
  <a-card class="article-toolbar">
    <!-- 平台切换 -->
    <a-radio-group :value="currentPlatformId" @change="onPlatformChange">
      <a-radio-button v-for="p in platforms" :key="p.id" :value="p.id">
        <GlobalOutlined />
        {{ p.label }}
        <a-tag v-if="p.unstable" color="orange" style="margin-left: 2px; font-size: 12px; line-height: 16px">受限</a-tag>
      </a-radio-button>
    </a-radio-group>


    <a-alert
      message="版权提示：采集的文章版权归原作者所有，导入后将以「草稿」保存并记录来源平台 / 作者 / 原文链接 / 版权说明，请确认授权后再发布。"
      type="info"
      show-icon
      style="margin-top: 12px"
    />

    <!-- 搜索区 -->
    <div class="search-row">
      <a-input-search
        v-model:value="keywordModel"
        :placeholder="isRss ? '输入关键词，从 RSS 源中过滤文章' : '输入关键词搜索文章，如：Vue3、TypeScript'"
        style="max-width: 480px"
        allow-clear
        enter-button
        @search="$emit('search')"
      >
        <template #enterButton>
          <a-button type="primary" :loading="loading">
            <search-outlined />
            搜索
          </a-button>
        </template>
      </a-input-search>

      <a-input
        v-if="isRss"
        v-model:value="rssUrlModel"
        placeholder="输入 RSS / Atom 源地址，如 https://example.com/atom.xml"
        style="max-width: 480px"
        allow-clear
      >
        <template #prefix><GlobalOutlined /></template>
      </a-input>
    </div>

    <!-- 导入配置 -->
    <div class="import-row">
      <span class="import-label">导入为草稿：</span>
      <a-select
        v-model:value="categoryIdModel"
        placeholder="选择分类（可选）"
        style="width: 180px"
        allow-clear
      >
        <a-select-option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</a-select-option>
      </a-select>
      <a-checkbox v-model:checked="autoSummaryModel">AI 生成摘要</a-checkbox>
      <a-checkbox v-model:checked="autoTagsModel">AI 生成标签</a-checkbox>
      <a-button
        type="primary"
        danger
        :loading="importing"
        :disabled="selectedCount === 0"
        @click="$emit('import')"
      >
        <import-outlined />
        导入选中（{{ selectedCount }}）
      </a-button>
    </div>
  </a-card>
</template>

<style scoped>
.search-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.import-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.import-label {
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
}
</style>
