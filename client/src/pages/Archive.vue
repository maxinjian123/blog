<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/article'
import { formatDate } from '@/utils/format'

const router = useRouter()
const articleStore = useArticleStore()

onMounted(() => {
  articleStore.fetchArchive()
})
</script>

<template>
  <lay-card title="文章归档" class="blog-card">
    <lay-loading :loading="articleStore.loading" tip="加载中...">
      <div v-if="articleStore.archive.length" class="archive-list">
        <div v-for="year in articleStore.archive" :key="year.year" class="archive-year">
          <h3 class="year-title">{{ year.year }}年</h3>
          <div v-for="month in year.months" :key="month.month" class="archive-month">
            <h4 class="month-title">{{ month.month }}月</h4>
            <div class="archive-articles">
              <div
                v-for="article in month.articles"
                :key="article.id"
                class="archive-item"
                @click="router.push(`/article/${article.id}`)"
              >
                <span class="archive-date">{{ formatDate(article.published_at) }}</span>
                <span class="archive-title">{{ article.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <lay-empty v-else description="暂无归档" />
    </lay-loading>
  </lay-card>
</template>

<style scoped>
.archive-list {
  padding: 8px 0;
}

.archive-year {
  margin-bottom: 40px;
}

.archive-year:last-child {
  margin-bottom: 0;
}

.year-title {
  font-size: 24px;
  font-weight: 600;
  color: #16baaa;
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #16baaa;
}

.archive-month {
  margin-bottom: 24px;
  padding-left: 8px;
}

.archive-month:last-child {
  margin-bottom: 0;
}

.month-title {
  font-size: 17px;
  font-weight: 500;
  color: #333;
  margin: 0 0 14px;
  padding-left: 12px;
  border-left: 4px solid #16baaa;
}

.archive-articles {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 16px;
}

.archive-item {
  display: flex;
  gap: 16px;
  align-items: baseline;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  color: #555;
  transition: all 0.2s ease;
}

.archive-item:hover {
  background: #f5fbf9;
}

.archive-item:hover .archive-title {
  color: #16baaa;
}

.archive-date {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  min-width: 80px;
}

.archive-title {
  font-size: 15px;
  line-height: 1.5;
}
</style>
