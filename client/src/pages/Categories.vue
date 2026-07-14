<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCategoryStore } from '@/stores/category'

const router = useRouter()
const categoryStore = useCategoryStore()

onMounted(() => {
  categoryStore.fetchCategories()
})
</script>

<template>
  <lay-card title="全部分类" class="blog-card">
    <lay-loading :loading="categoryStore.loading" tip="加载中...">
      <div v-if="categoryStore.categories.length" class="category-grid">
        <div
          v-for="category in categoryStore.categories"
          :key="category.id"
          class="category-card"
          @click="router.push(`/category/${category.id}/${category.slug}`)"
        >
          <h4>{{ category.name }}</h4>
          <p>{{ category.description || '暂无描述' }}</p>
          <div class="category-count">
            <lay-icon type="layui-icon-file" />
            <span>{{ category.article_count || 0 }} 篇文章</span>
          </div>
        </div>
      </div>
      <lay-empty v-else description="暂无分类" />
    </lay-loading>
  </lay-card>
</template>

<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.category-card {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid #f0f0f0;
}

.category-card:hover {
  background: #fff;
  border-color: #16baaa;
  box-shadow: 0 8px 24px rgba(22, 186, 170, 0.12);
  transform: translateY(-4px);
}

.category-card h4 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #333;
}

.category-card p {
  margin: 0 0 16px;
  color: #888;
  font-size: 14px;
  line-height: 1.7;
  min-height: 48px;
}

.category-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #16baaa;
  font-weight: 500;
}
</style>
