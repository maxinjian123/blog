<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  loading: boolean
  item: { id: string; original_name: string } | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [id: string, newName: string]
}>()

const name = ref('')

// 打开时同步文件名
watch(() => props.open, (v) => {
  if (v && props.item) {
    name.value = props.item.original_name
  }
})

function handleOk() {
  if (props.item) {
    emit('submit', props.item.id, name.value)
  }
}
</script>

<template>
  <a-modal
    :open="open"
    title="重命名文件"
    :confirm-loading="loading"
    @ok="handleOk"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <a-form layout="vertical" style="margin-top: 16px">
      <a-form-item label="文件名">
        <a-input v-model:value="name" @press-enter="handleOk" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
