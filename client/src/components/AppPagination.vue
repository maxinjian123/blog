<script setup lang="ts">
interface Props {
  page: number
  pageSize: number
  total: number
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'change', page: number): void
}>()

function onChange(page: number) {
  emit('change', page)
}
</script>

<template>
  <div class="app-pagination">
    <lay-page
      :model-value="page"
      :limit="pageSize"
      :total="total"
      @change="onChange"
    />
  </div>
</template>

<style scoped>
.app-pagination {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
</style>
