<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { message } from 'ant-design-vue'

interface Announcement {
  id: number
  content: string
  is_active: boolean
  sort_order: number
  created_at: string
}

const announcements = ref<Announcement[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const editingAnnouncement = ref<Announcement | null>(null)
const formContent = ref('')
const formActive = ref(true)
const formSortOrder = ref(0)

onMounted(() => {
  fetchAnnouncements()
})

async function fetchAnnouncements() {
  loading.value = true
  try {
    const res = await api.get('/announcements')
    announcements.value = res.data.data || res.data || []
  } catch {
    message.error('获取公告列表失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingAnnouncement.value = null
  formContent.value = ''
  formActive.value = true
  formSortOrder.value = 0
  modalVisible.value = true
}

function openEdit(ann: Announcement) {
  editingAnnouncement.value = ann
  formContent.value = ann.content
  formActive.value = ann.is_active
  formSortOrder.value = ann.sort_order
  modalVisible.value = true
}

async function handleSave() {
  if (!formContent.value.trim()) {
    message.warning('公告内容不能为空')
    return
  }
  try {
    if (editingAnnouncement.value) {
      await api.put(`/announcements/${editingAnnouncement.value.id}`, {
        content: formContent.value,
        is_active: formActive.value,
        sort_order: formSortOrder.value
      })
      message.success('公告更新成功')
    } else {
      await api.post('/announcements', {
        content: formContent.value,
        is_active: formActive.value,
        sort_order: formSortOrder.value
      })
      message.success('公告创建成功')
    }
    modalVisible.value = false
    fetchAnnouncements()
  } catch {
    message.error('保存失败')
  }
}

async function handleDelete(ann: Announcement) {
  try {
    await api.delete(`/announcements/${ann.id}`)
    message.success('公告删除成功')
    fetchAnnouncements()
  } catch {
    message.error('删除失败')
  }
}
</script>

<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center">
      <h2>公告管理</h2>
      <a-button type="primary" @click="openCreate">新建公告</a-button>
    </div>

    <a-table
      :columns="[
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
        { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 100 },
        { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
        { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
        { title: '操作', key: 'action', width: 180 }
      ]"
      :data-source="announcements"
      :loading="loading"
      row-key="id"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'is_active'">
          <a-tag :color="record.is_active ? 'green' : 'default'">
            {{ record.is_active ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'created_at'">
          {{ new Date(record.created_at).toLocaleString('zh-CN') }}
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="openEdit(record)">编辑</a-button>
            <a-popconfirm title="确定删除该公告?" @confirm="handleDelete(record)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="editingAnnouncement ? '编辑公告' : '新建公告'"
      @ok="handleSave"
      width="500px"
    >
      <a-form layout="vertical">
        <a-form-item label="公告内容">
          <a-textarea v-model:value="formContent" :rows="4" placeholder="请输入公告内容" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="formSortOrder" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="状态">
          <a-switch v-model:checked="formActive" checked-children="启用" un-checked-children="禁用" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>