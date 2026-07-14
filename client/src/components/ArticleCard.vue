<script setup lang="ts">
import { useRouter } from 'vue-router'
import { formatDate } from '@/utils/format'
import type { Article } from '@/types/models'

interface Props {
  article: Article
  layout?: 'list' | 'card'
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'list'
})
const router = useRouter()

function goToArticle() {
  router.push(`/article/${props.article.id}`)
}

function goToCategory() {
  if (props.article.category) {
    router.push(`/category/${props.article.category.id}/${props.article.category.slug}`)
  }
}
</script>

<template>
  <lay-card class="article-card" :class="`is-${props.layout}`" shadow="hover">
    <div class="article-cover" @click="goToArticle">
      <img v-if="article.cover" :src="article.cover" :alt="article.title" />
      <div v-else class="article-cover-placeholder">{{ article.title[0] }}</div>
    </div>
    <div class="article-body">
      <h3 class="article-title" @click="goToArticle">{{ article.title }}</h3>
      <p class="article-summary">{{ article.summary || '暂无摘要' }}</p>
      <div class="article-meta">
        <lay-tag v-if="article.category" size="sm" color="blue" @click.stop="goToCategory">
          {{ article.category.name }}
        </lay-tag>
        <span><lay-icon type="layui-icon-date" /> {{ formatDate(article.published_at || article.created_at) }}</span>
        <span><lay-icon type="layui-icon-read" /> {{ article.view_count || 0 }}</span>
        <span><lay-icon type="layui-icon-praise" /> {{ article.like_count || 0 }}</span>
        <span v-if="article.comment_count !== undefined"><lay-icon type="layui-icon-reply-fill" /> {{ article.comment_count }}</span>
      </div>
      <div v-if="article.tags?.length" class="article-tags">
        <lay-tag
          v-for="tag in article.tags"
          :key="tag.id"
          size="sm"
          color="green"
          style="cursor: pointer;"
          @click.stop="router.push(`/tag/${tag.id}/${tag.slug}`)"
        >
          {{ tag.name }}
        </lay-tag>
      </div>
    </div>
  </lay-card>
</template>

<style scoped>
.article-card {
  margin-bottom: 16px;
  cursor: pointer;
}

.article-card.is-card {
  margin-bottom: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.article-card.is-card :deep(.layui-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.article-cover {
  width: 100%;
  height: 180px;
  overflow: hidden;
  border-radius: 4px;
  margin-bottom: 12px;
}

.article-card.is-card .article-cover {
  height: 200px;
  margin-bottom: 16px;
}

.article-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.article-cover:hover img {
  transform: scale(1.03);
}

.article-cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #16baaa 0%, #1e9fff 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 600;
}

.article-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.article-title:hover {
  color: #16baaa;
}

.article-summary {
  margin: 0 0 12px;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #999;
  flex-wrap: wrap;
}

.article-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.article-tags {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 卡片布局额外样式 */
.article-card.is-card .article-summary {
  -webkit-line-clamp: 3;
  margin-bottom: 16px;
}

.article-card.is-card .article-tags {
  margin-top: auto;
  padding-top: 12px;
}
</style>
