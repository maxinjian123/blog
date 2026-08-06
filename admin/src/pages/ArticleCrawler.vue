<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { EyeOutlined, LinkOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import type { TablePaginationConfig } from 'ant-design-vue'
import { useArticleCrawler, type ArticleItem } from '@/composables/useArticleCrawler'
import ArticleToolbar from '@/components/articleCrawler/ArticleToolbar.vue'
import ArticlePreviewModal from '@/components/articleCrawler/ArticlePreviewModal.vue'

const {
  platforms,
  loading,
  list,
  total,
  query,
  isRss,
  selectedRowKeys,
  importConfig,
  categories,
  importing,
  importResult,
  previewVisible,
  previewLoading,
  previewData,
  fetchList,
  handlePlatformChange,
  handleTableChange,
  fetchPreview,
  handleImport,
  fetchCategories
} = useArticleCrawler()

onMounted(() => {
  fetchCategories()
})

// 表格列
const columns = [
  { title: '标题', key: 'title', ellipsis: true },
  { title: '作者', key: 'author', width: 120, ellipsis: true },
  { title: '摘要', key: 'summary', ellipsis: true },
  { title: '发布时间', key: 'publish_time', width: 230 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' as const }
]

// 行选择
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys
  }
}))

function formatDate(ts: number): string {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '-'
}

// 分页配置
const pagination = computed<TablePaginationConfig>(() => ({
  current: query.page,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`
}))

// 导入结果弹窗
const resultVisible = computed(() => !!importResult.value)

function closeResult() {
  importResult.value = null
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>文章抓取</h2>
      <span class="page-desc">按关键词从多平台采集文章，预览后勾选导入为博客草稿（自动记录来源与版权信息）</span>
    </div>

    <ArticleToolbar
      :platforms="platforms"
      :current-platform="query.platform"
      :keyword="query.keyword"
      :rss-url="query.rss_url"
      :is-rss="isRss"
      :loading="loading"
      :importing="importing"
      :selected-count="selectedRowKeys.length"
      :categories="categories"
      :category-id="importConfig.category_id"
      :auto-summary="importConfig.autoSummary"
      :auto-tags="importConfig.autoTags"
      @update:current-platform="query.platform = $event"
      @update:keyword="query.keyword = $event"
      @update:rss-url="query.rss_url = $event"
      @update:category-id="importConfig.category_id = $event"
      @update:auto-summary="importConfig.autoSummary = $event"
      @update:auto-tags="importConfig.autoTags = $event"
      @platform-change="handlePlatformChange"
      @search="fetchList"
      @import="handleImport"
    />

    <a-card style="margin-top: 16px" :body-style="{ padding: '12px' }">
      <a-table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :row-key="(r: ArticleItem) => r._key || r.id"
        :pagination="pagination"
        :row-selection="rowSelection"
        :scroll="{ x: 900 }"
        @change="(p: TablePaginationConfig) => handleTableChange({ current: p.current, pageSize: p.pageSize })"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <div class="title-cell">
              <a :href="record.source_url" target="_blank" rel="noopener" class="title-link">{{ record.title }}</a>
            </div>
          </template>
          <template v-else-if="column.key === 'author'">
            {{ record.author || '-' }}
          </template>
          <template v-else-if="column.key === 'summary'">
            <span class="summary-cell">{{ record.summary || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'publish_time'">
            {{ formatDate(record.publish_time) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" type="link" @click="fetchPreview(record)">
                <eye-outlined />
                预览
              </a-button>
              <a :href="record.source_url" target="_blank" rel="noopener" class="action-link">
                <link-outlined />
                原文
              </a>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <a-empty :description="query.keyword ? '没有找到匹配的文章' : '请输入关键词搜索'" />
        </template>
      </a-table>
    </a-card>

    <!-- 预览弹窗 -->
    <ArticlePreviewModal
      v-model:open="previewVisible"
      :loading="previewLoading"
      :data="previewData"
    />

    <!-- 导入结果弹窗 -->
    <a-modal
      :open="resultVisible"
      @update:open="closeResult"
      :footer="null"
      width="640px"
      title="导入结果"
    >
      <template v-if="importResult">
        <a-alert
          :type="importResult.failed === 0 ? 'success' : 'warning'"
          show-icon
          :message="`成功导入 ${importResult.imported} 篇，失败 ${importResult.failed} 篇`"
          style="margin-bottom: 16px"
        />
        <div v-if="importResult.results.length" style="margin-bottom: 16px">
          <div class="result-section-title">成功导入（已保存为草稿）：</div>
          <a-list size="small" bordered :data-source="importResult.results">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.title" :description="item.tags?.length ? `标签：${item.tags.join('、')}` : ''" />
              </a-list-item>
            </template>
          </a-list>
        </div>
        <div v-if="importResult.failed_list.length">
          <div class="result-section-title">失败项：</div>
          <a-table
            size="small"
            :data-source="importResult.failed_list"
            :pagination="false"
            :columns="[
              { title: '文章', dataIndex: 'title', key: 'title', ellipsis: true },
              { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true }
            ]"
          />
        </div>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
}
.page-desc {
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}
.title-cell {
  font-weight: 500;
}
.title-link {
  color: inherit;
}
.summary-cell {
  display: block;
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
}
.action-link {
  font-size: 13px;
}
.result-section-title {
  font-weight: 500;
  margin-bottom: 8px;
}
</style>
