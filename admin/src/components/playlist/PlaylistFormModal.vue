<script setup lang="ts">
import { PictureOutlined } from '@ant-design/icons-vue'
import { coverUrl } from '@/composables/usePlaylistManage'

defineProps<{
  open: boolean
  loading: boolean
  mode: 'create' | 'edit'
  coverFile: File | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  coverSelect: [info: any]
  submit: []
}>()

// 使用 defineModel 对每个表单字段建模，避免直接修改父组件对象
const name = defineModel<string>('name', { required: true })
const description = defineModel<string>('description', { required: true })
const cover = defineModel<string>('cover', { required: true })
const coverStorage = defineModel<'local' | 'minio'>('coverStorage', { required: true })
</script>

<template>
  <a-modal
    :open="open"
    :title="mode === 'create' ? '创建歌单' : '编辑歌单'"
    :confirm-loading="loading"
    @ok="emit('submit')"
    @update:open="(v: boolean) => emit('update:open', v)"
    :ok-text="mode === 'create' ? '创建' : '保存'"
    cancel-text="取消"
    width="560px"
  >
    <a-form layout="vertical" style="margin-top: 16px">
      <a-form-item label="歌单名称" required>
        <a-input
          v-model:value="name"
          placeholder="请输入歌单名称"
          :maxlength="100"
          show-count
        />
      </a-form-item>
      <a-form-item label="描述（可选）">
        <a-textarea
          v-model:value="description"
          placeholder="请输入歌单描述"
          :rows="3"
          :maxlength="500"
          show-count
        />
      </a-form-item>
      <a-form-item label="封面 URL（可选）">
        <a-input
          v-model:value="cover"
          placeholder="封面图片 URL，可留空"
        />
      </a-form-item>
      <a-form-item label="上传封面文件（可选）">
        <a-upload
          :before-upload="() => false"
          :max-count="1"
          accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
          @change="(info: any) => emit('coverSelect', info)"
        >
          <a-button>
            <template #icon>
              <PictureOutlined />
            </template>
            选择封面图片
          </a-button>
        </a-upload>
        <div style="color: #999; font-size: 12px; margin-top: 4px">
          支持 JPG / PNG / WEBP / GIF，上传后将覆盖 URL 设置
        </div>
        <div v-if="coverFile" style="margin-top: 8px; color: #52c41a; font-size: 12px">
          已选择：{{ coverFile.name }}
        </div>
        <div v-else-if="cover" style="margin-top: 8px">
          <img
            :src="coverUrl(cover)"
            alt="封面预览"
            style="max-width: 100px; max-height: 100px; border-radius: 4px; object-fit: cover"
          />
        </div>
      </a-form-item>
      <a-form-item v-if="coverFile" label="封面存储到">
        <a-radio-group v-model:value="coverStorage">
          <a-radio value="local">本地存储</a-radio>
          <a-radio value="minio">MinIO 存储</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>
