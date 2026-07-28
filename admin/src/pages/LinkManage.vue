<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { message } from 'ant-design-vue'

interface Link {
  id: string
  name: string
  url: string
  description: string | null
  avatar: string | null
  category: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

const links = ref<Link[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const editingLink = ref<Link | null>(null)
const form = ref({
  name: '',
  url: '',
  description: '',
  avatar: '',
  category: '友情链接',
  sort_order: 0,
  is_active: true
})

onMounted(() => {
  fetchLinks()
})

async function fetchLinks() {
  loading.value = true
  try {
    const res = await api.get('/links', { params: { all: 'true' } })
    links.value = res.data.data || res.data || []
  } catch {
    message.error('获取友链列表失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingLink.value = null
  form.value = {
    name: '',
    url: '',
    description: '',
    avatar: '',
    category: '友情链接',
    sort_order: 0,
    is_active: true
  }
  modalVisible.value = true
}

function openEdit(link: Link) {
  editingLink.value = link
  form.value = {
    name: link.name,
    url: link.url,
    description: link.description || '',
    avatar: link.avatar || '',
    category: link.category || '友情链接',
    sort_order: link.sort_order,
    is_active: link.is_active
  }
  modalVisible.value = true
}

async function handleSave() {
  if (!form.value.name.trim() || !form.value.url.trim()) {
    message.warning('名称和地址不能为空')
    return
  }
  try {
    const payload = {
      name: form.value.name,
      url: form.value.url,
      description: form.value.description || null,
      avatar: form.value.avatar || null,
      category: form.value.category || '友情链接',
      sort_order: form.value.sort_order,
      is_active: form.value.is_active
    }
    if (editingLink.value) {
      await api.put(`/links/${editingLink.value.id}`, payload)
      message.success('友链更新成功')
    } else {
      await api.post('/links', payload)
      message.success('友链创建成功')
    }
    modalVisible.value = false
    fetchLinks()
  } catch {
    message.error('保存失败')
  }
}

async function handleDelete(link: Link) {
  try {
    await api.delete(`/links/${link.id}`)
    message.success('友链删除成功')
    fetchLinks()
  } catch {
    message.error('删除失败')
  }
}

async function toggleActive(link: Link) {
  try {
    await api.put(`/links/${link.id}`, { is_active: !link.is_active })
    message.success(link.is_active ? '已禁用' : '已启用')
    fetchLinks()
  } catch {
    message.error('状态切换失败')
  }
}
</script>

<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center">
      <h2>友链管理</h2>
      <a-button type="primary" @click="openCreate">新建友链</a-button>
    </div>

    <a-table
      :columns="[
        { title: '头像', dataIndex: 'avatar', key: 'avatar', width: 70 },
        { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
        { title: '地址', dataIndex: 'url', key: 'url', ellipsis: true },
        { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
        { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
        { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
        { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 90 },
        { title: '操作', key: 'action', width: 200 }
      ]"
      :data-source="links"
      :loading="loading"
      row-key="id"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'avatar'">
          <a-avatar
            v-if="record.avatar"
            :src="record.avatar"
            :size="32"
          />
          <a-avatar v-else :size="32">{{ record.name?.charAt(0) || '?' }}</a-avatar>
        </template>
        <template v-if="column.key === 'url'">
          <a :href="record.url" target="_blank" rel="noopener noreferrer" style="color: #1677ff">
            {{ record.url }}
          </a>
        </template>
        <template v-if="column.key === 'is_active'">
          <a-tag :color="record.is_active ? 'green' : 'default'">
            {{ record.is_active ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="toggleActive(record)">
              {{ record.is_active ? '禁用' : '启用' }}
            </a-button>
            <a-button size="small" @click="openEdit(record)">编辑</a-button>
            <a-popconfirm title="确定删除该友链?" @confirm="handleDelete(record)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalVisible"
      :title="editingLink ? '编辑友链' : '新建友链'"
      @ok="handleSave"
      width="560px"
    >
      <a-form layout="vertical">
        <a-form-item label="站点名称" required>
          <a-input v-model:value="form.name" placeholder="请输入站点名称" />
        </a-form-item>
        <a-form-item label="站点地址" required>
          <a-input v-model:value="form.url" placeholder="https://example.com" />
        </a-form-item>
        <a-form-item label="站点描述">
          <a-textarea v-model:value="form.description" :rows="2" placeholder="请输入站点描述" />
        </a-form-item>
        <a-form-item label="头像/Logo URL">
          <a-input v-model:value="form.avatar" placeholder="https://example.com/logo.png" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="分类">
              <a-input v-model:value="form.category" placeholder="友情链接" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序">
              <a-input-number v-model:value="form.sort_order" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="状态">
          <a-switch v-model:checked="form.is_active" checked-children="启用" un-checked-children="禁用" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
