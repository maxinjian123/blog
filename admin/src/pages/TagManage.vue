<script setup lang="ts">
import {h, onMounted, reactive, ref} from 'vue'
import api from '@/utils/api'
import {message, Modal} from 'ant-design-vue'
import {ExclamationCircleOutlined, PlusOutlined} from '@ant-design/icons-vue'

interface Tag {
  id: string
  name: string
  slug: string
  articleCount?: number
  createdAt?: string
}

interface ArticleItem {
  id: string
  title: string
  status: string
  created_at: string
  view_count: number
}

const tags = ref<Tag[]>([])
const loading = ref(false)
const modalOpen = ref(false)
const modalTitle = ref('新建标签')
const isEditing = ref(false)
const saving = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const articlesModalOpen = ref(false)
const articlesModalTitle = ref('')
const articles = ref<ArticleItem[]>([])
const articlesLoading = ref(false)
const articlesCurrentPage = ref(1)
const articlesPageSize = ref(10)
const articlesTotal = ref(0)
const articlesKeyword = ref('')
const currentTagId = ref('')

const sortField = ref<string>('')
const sortOrder = ref<string>('')
const keyword = ref('')

const formState = reactive({
  id: '',
  name: '',
  slug: ''
})

const columns = [
  {title: 'ID', dataIndex: 'id', key: 'id', width: 200, ellipsis: true},
  {title: '名称', dataIndex: 'name', key: 'name'},
  {title: '别名', dataIndex: 'slug', key: 'slug'},
  {
    title: '文章数',
    dataIndex: 'articleCount',
    key: 'articleCount',
    width: 100,
    sorter: true,
    customRender: ({record}: { record: Tag }) =>
        h(
            'a',
            {
              style: {color: '#1677ff', cursor: 'pointer', fontWeight: '500'},
              onClick: () => openArticlesModal(record)
            },
            {default: () => record.articleCount || 0}
        )
  },
  {
    title: '操作',
    key: 'action',
    width: 160
  }
]

const articleColumns = [
  {title: 'ID', dataIndex: 'id', key: 'id', width: 200, ellipsis: true},
  {title: '标题', dataIndex: 'title', key: 'title', ellipsis: true},
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({record}: { record: ArticleItem }) => {
      const isPublished = record.status === 'published'
      return h(
          'a-tag',
          {color: isPublished ? 'green' : 'orange'},
          {default: () => isPublished ? '已发布' : '草稿'}
      )
    }
  },
  {title: '阅读量', dataIndex: 'view_count', key: 'view_count', width: 80},
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
    customRender: ({record}: { record: ArticleItem }) =>
        record.created_at ? new Date(record.created_at).toLocaleString('zh-CN') : '-'
  }
]

async function loadData() {
  loading.value = true
  try {
    const params: any = {page: currentPage.value, pageSize: pageSize.value}
    if (sortField.value) {
      params.sort = sortField.value
      params.order = sortOrder.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    const res: any = await api.get('/tags', {params})
    const data = res.data || res
    tags.value = data.list || data.rows || []
    total.value = data.pagination?.total || data.total || 0
  } finally {
    loading.value = false
  }
}

function onSearch() {
  currentPage.value = 1
  loadData()
}

function onPageChange(page: number, size: number) {
  // currentPage.value = page
  // pageSize.value = size
  // loadData()
}

function handleTableChange(pag: { current: number; pageSize: number }, filters: any, sorter: any) {
  if (sorter.order) {
    sortField.value = sorter.field === 'articleCount' ? 'articleCount' : sorter.field
    sortOrder.value = sorter.order === 'ascend' ? 'ASC' : 'DESC'
  } else {
    sortField.value = ''
    sortOrder.value = ''
  }
  currentPage.value = pag.current
  pageSize.value = pag.pageSize
  loadData()
}

function openCreate() {
  modalTitle.value = '新建标签'
  isEditing.value = false
  formState.id = ''
  formState.name = ''
  formState.slug = ''
  modalOpen.value = true
}

function handleEdit(record: Tag) {
  modalTitle.value = '编辑标签'
  isEditing.value = true
  formState.id = record.id
  formState.name = record.name
  formState.slug = record.slug
  modalOpen.value = true
}

async function handleSave() {
  if (!formState.name.trim()) {
    message.warning('请输入标签名称')
    return
  }
  saving.value = true
  try {
    if (isEditing.value) {
      await api.put(`/tags/${formState.id}`, {
        name: formState.name,
        slug: formState.slug
      })
      message.success('更新成功')
    } else {
      await api.post('/tags', {
        name: formState.name,
        slug: formState.slug
      })
      message.success('创建成功')
    }
    modalOpen.value = false
    await loadData()
  } catch {
    message.error('操作失败')
  } finally {
    saving.value = false
  }
}

function handleDelete(record: Tag) {
  Modal.confirm({
    title: '确认删除',
    icon: h(ExclamationCircleOutlined),
    content: `确定要删除标签「${record.name}」吗？`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await api.delete(`/tags/${record.id}`)
        message.success('删除成功')
        await loadData()
      } catch {
        message.error('删除失败')
      }
    }
  })
}

function openArticlesModal(record: Tag) {
  currentTagId.value = record.id
  articlesModalTitle.value = `「${record.name}」文章`
  articlesKeyword.value = ''
  articlesCurrentPage.value = 1
  articlesModalOpen.value = true
  loadArticles()
}

async function loadArticles() {
  articlesLoading.value = true
  try {
    const res: any = await api.get(`/tags/${currentTagId.value}/articles`, {
      params: {
        page: articlesCurrentPage.value,
        pageSize: articlesPageSize.value,
        keyword: articlesKeyword.value
      }
    })
    const data = res.data || res
    articles.value = data.list || data.rows || []
    articlesTotal.value = data.pagination?.total || data.total || 0
  } finally {
    articlesLoading.value = false
  }
}

function onArticlesPageChange(page: number, size: number) {
  articlesCurrentPage.value = page
  articlesPageSize.value = size
  loadArticles()
}

function onArticlesSearch() {
  articlesCurrentPage.value = 1
  loadArticles()
}

function closeArticlesModal() {
  articlesModalOpen.value = false
  articles.value = []
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>标签管理</h2>
      <a-space>
        <a-input-search
            v-model:value="keyword"
            placeholder="搜索标签名称或别名..."
            style="width: 280px"
            @search="onSearch"
            allow-clear
        />
        <a-button type="primary" @click="openCreate">
          <template #icon>
            <PlusOutlined/>
          </template>
          新建标签
        </a-button>
      </a-space>
    </div>

    <a-table
        :columns="(columns as any)"
        :data-source="tags"
        :loading="loading"
        :pagination="{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t: number) => `共 ${t} 个标签`,
          onChange: onPageChange,
        }"
        :row-key="(r: any) => r.id"
        size="middle"
        @change="handleTableChange"
    >
      <template #bodyCell="{record, column}">
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button size="small" type="primary" @click="handleEdit(record)">编辑</a-button>
            <a-button size="small" danger type="link" @click="handleDelete(record)">删除</a-button>
            <a-button size="small" type="link" @click="openArticlesModal(record)">文章</a-button>
          </a-space>
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
        <a-form-item label="标签名称" required>
          <a-input
              v-model:value="formState.name"
              placeholder="输入标签名称"
          />
        </a-form-item>
        <a-form-item label="别名 (URL)">
          <a-input
              v-model:value="formState.slug"
              placeholder="英文别名，留空则自动生成"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
        v-model:open="articlesModalOpen"
        :title="articlesModalTitle"
        width="800px"
        :footer="null"
        @cancel="closeArticlesModal"
    >
      <div style="margin-bottom: 16px">
        <a-input-search
            v-model:value="articlesKeyword"
            placeholder="搜索文章标题或状态..."
            style="width: 300px"
            @search="onArticlesSearch"
        />
      </div>
      <a-table
          :columns="(articleColumns as any)"
          :data-source="articles"
          :loading="articlesLoading"
          :pagination="{
          current: articlesCurrentPage,
          pageSize: articlesPageSize,
          total: articlesTotal,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 篇文章`,
          onChange: onArticlesPageChange,
          onShowSizeChange: onArticlesPageChange
        }"
          :row-key="(r: any) => r.id"
          size="middle"
      />
    </a-modal>
  </div>
</template>