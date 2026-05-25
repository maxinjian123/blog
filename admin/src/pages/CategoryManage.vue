<script setup lang="ts">
import {h, onMounted, reactive, ref} from 'vue'
import api from '@/utils/api'
import {message, Modal} from 'ant-design-vue'
import {DeleteOutlined, EditOutlined, ExclamationCircleOutlined, PlusOutlined} from '@ant-design/icons-vue'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  articleCount?: number
  createdAt?: string
}

const categories = ref<Category[]>([])
const loading = ref(false)
const modalOpen = ref(false)
const modalTitle = ref('新建分类')
const isEditing = ref(false)
const saving = ref(false)

const formState = reactive({
  id: '',
  name: '',
  slug: '',
  description: ''
})

const columns = [
  {title: 'ID', dataIndex: 'id', key: 'id'},
  {title: '名称', dataIndex: 'name', key: 'name'},
  {title: '别名', dataIndex: 'slug', key: 'slug'},
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
    customRender: ({text}: { text: string }) => text || '-'
  },
  {title: '文章数', dataIndex: 'articleCount', key: 'articleCount', width: 80},
  {
    title: '操作',
    key: 'action',
    width: 160
  }
]

async function loadData() {
  loading.value = true
  try {
    const res: any = await api.get('/categories', {params: {pageSize: 100}})
    categories.value = (res.data?.rows || res.data?.list || res.data || [])
  } finally {
    loading.value = false
  }
}

function openCreate() {
  modalTitle.value = '新建分类'
  isEditing.value = false
  formState.id = ''
  formState.name = ''
  formState.slug = ''
  formState.description = ''
  modalOpen.value = true
}

function handleEdit(record: Category) {
  modalTitle.value = '编辑分类'
  isEditing.value = true
  formState.id = record.id
  formState.name = record.name
  formState.slug = record.slug
  formState.description = record.description
  modalOpen.value = true
}

async function handleSave() {
  if (!formState.name.trim()) {
    message.warning('请输入分类名称')
    return
  }
  saving.value = true
  try {
    if (isEditing.value) {
      await api.put(`/categories/${formState.id}`, {
        name: formState.name,
        slug: formState.slug,
        description: formState.description
      })
      message.success('更新成功')
    } else {
      await api.post('/categories', {
        name: formState.name,
        slug: formState.slug,
        description: formState.description
      })
      message.success('创建成功')
    }
    modalOpen.value = false
    loadData()
  } catch {
    message.error('操作失败')
  } finally {
    saving.value = false
  }
}

function handleDelete(record: Category) {
  Modal.confirm({
    title: '确认删除',
    icon: h(ExclamationCircleOutlined),
    content: `确定要删除分类「${record.name}」吗？该分类下的文章将变为未分类。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await api.delete(`/categories/${record.id}`)
        message.success('删除成功')
        loadData()
      } catch {
        message.error('删除失败')
      }
    }
  })
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>分类管理</h2>
      <a-button type="primary" @click="openCreate">
        <template #icon>
          <PlusOutlined/>
        </template>
        新建分类
      </a-button>
    </div>

    <a-table
        :columns="(columns as any)"
        :data-source="categories"
        :loading="loading"
        :pagination="false"
        :row-key="(r: any) => r.id"
        size="middle"
    >
      <template #bodyCell="{record, column}">
        <template v-if="column.key === 'action'">
          <a-button
              type="link"
              size="small"
              @click="handleEdit(record)"
          >
            <template #icon>
              <EditOutlined/>
            </template>
            编辑
          </a-button>
          <a-button
              danger
              type="link"
              size="small"
              @click="handleDelete(record)"
          >
            <template #icon>
              <DeleteOutlined/>
            </template>
            删除
          </a-button>
        </template>
      </template>
    </a-table>

    <a-modal
        v-model:open="modalOpen"
        :title="modalTitle"
        :confirm-loading="saving"
        @ok="handleSave"
    >
      <a-form layout="vertical">
        <a-form-item label="分类名称" required>
          <a-input
              v-model:value="formState.name"
              placeholder="输入分类名称"
          />
        </a-form-item>
        <a-form-item label="别名 (URL)">
          <a-input
              v-model:value="formState.slug"
              placeholder="英文别名，留空则自动生成"
          />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea
              v-model:value="formState.description"
              placeholder="分类描述（可选）"
              :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>