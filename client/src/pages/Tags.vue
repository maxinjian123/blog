<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTagStore } from '@/stores/tag'

const router = useRouter()
const tagStore = useTagStore()

onMounted(() => {
  tagStore.fetchTags()
})
</script>

<template>
  <lay-card title="全部标签" class="blog-card">
    <lay-loading :loading="tagStore.loading" tip="加载中...">
      <div v-if="tagStore.tags.length" class="tag-cloud">
        <lay-tag
          v-for="tag in tagStore.tags"
          :key="tag.id"
          color="green"
          style="cursor: pointer; margin: 6px;"
          @click="router.push(`/tag/${tag.id}/${tag.slug}`)"
        >
          {{ tag.name }}
          <lay-badge v-if="tag.articleCount" :value="tag.articleCount" />
        </lay-tag>
      </div>
      <lay-empty v-else description="暂无标签" />
    </lay-loading>
  </lay-card>
</template>

<style scoped>
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  padding: 8px;
}
</style>
