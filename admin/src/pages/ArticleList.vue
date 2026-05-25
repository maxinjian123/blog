<script setup lang="ts">
import {useArticleStore} from '@/stores/article'
import api from '@/utils/api'
import {ExclamationCircleOutlined, PlusOutlined, SearchOutlined} from '@ant-design/icons-vue'
import {message, Modal} from 'ant-design-vue'
import dayjs from 'dayjs'
import {h, onMounted, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {CLIENT_BASE_URL} from "@/config.ts";

const router = useRouter()
const articleStore = useArticleStore()

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: undefined as string | undefined,
  category_id: undefined as string | undefined
})

const categories = ref<Array<{ id: string; name: string }>>([])
const selectedRowKeys = ref<string[]>([])
const batchLoading = ref(false)
const coverPreviewVisible = ref(false)
const coverPreviewUrl = ref('')

const columns = [
  {title: 'ID', dataIndex: 'id', key: 'id'},
  {title: '标题', dataIndex: 'title', key: 'title', ellipsis: true},
  {
    title: '封面',
    dataIndex: 'cover',
    key: 'cover',
    width: 130,
    // customRender: ({ text }: { text: string }) => {
    //   if (!text) return h('span', { style: { color: '#ccc' } }, '无')
    //   return h('img', {
    //     src: text,
    //     style: { width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' },
    //     onClick: () => { coverPreviewUrl.value = text; coverPreviewVisible.value = true }
    //   })
    // }
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
    width: 100,
    customRender: ({text}: { text: { name: string } }) => text?.name || '-'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 90
  },
  {
    title: '浏览量',
    dataIndex: 'view_count',
    key: 'view_count',
    width: 80
  },
  {
    title: '发布时间',
    dataIndex: 'published_at',
    key: 'published_at',
    width: 160,
    customRender: ({text}: { text: string }) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-')
  },
  {
    title: '操作',
    key: 'action',
    width: 180
  }
]

async function loadCategories() {
  try {
    const res: any = await api.get('/categories', {params: {pageSize: 100}})
    categories.value = res.data?.rows || res.data?.list || res.data || []
  } catch {
    categories.value = []
  }
}

async function loadData() {
  await articleStore.fetchArticles(query)
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.status = undefined
  query.category_id = undefined
  query.page = 1
  loadData()
}

function handleDelete(id: string, title: string) {
  Modal.confirm({
    title: '确认删除',
    icon: h(ExclamationCircleOutlined),
    content: `确定要删除文章「${title}」吗？此操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await articleStore.deleteArticle(id)
        message.success('删除成功')
        loadData()
      } catch {
        message.error('删除失败')
      }
    }
  })
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的文章')
    return
  }
  Modal.confirm({
    title: '确认批量删除',
    icon: h(ExclamationCircleOutlined),
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 篇文章吗？此操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      batchLoading.value = true
      try {
        await articleStore.deleteArticles(selectedRowKeys.value)
        message.success('批量删除成功')
        selectedRowKeys.value = []
        loadData()
      } catch {
        message.error('批量删除失败')
      } finally {
        batchLoading.value = false
      }
    }
  })
}

function handleTableChange(pag: { current: number; pageSize: number }) {
  query.page = pag.current
  query.pageSize = pag.pageSize
  loadData()
}

onMounted(() => {
  loadCategories()
  loadData()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>文章管理</h2>
      <a-space>
        <a-button v-if="selectedRowKeys.length > 0" danger :loading="batchLoading" @click="handleBatchDelete"> 批量删除
          ({{ selectedRowKeys.length }})
        </a-button>
        <a-button type="primary" @click="router.push('/articles/create')">
          <template #icon>
            <PlusOutlined/>
          </template>
          新建文章
        </a-button>
      </a-space>
    </div>

    <div class="search-bar">
      <a-input v-model:value="query.keyword" placeholder="搜索文章标题..." style="width: 240px" allow-clear
               @pressEnter="handleSearch">
        <template #prefix>
          <SearchOutlined/>
        </template>
      </a-input>
      <a-select v-model:value="query.status" placeholder="文章状态" style="width: 140px" allow-clear
                @change="handleSearch">
        <a-select-option value="published">已发布</a-select-option>
        <a-select-option value="draft">草稿</a-select-option>
      </a-select>
      <a-select v-model:value="query.category_id" placeholder="选择分类" style="width: 160px" allow-clear
                @change="handleSearch">
        <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </a-select-option>
      </a-select>
      <a-button @click="handleReset">重置</a-button>
    </div>

    <a-table
        :columns="columns as any"
        :data-source="articleStore.articles"
        :loading="articleStore.loading"
        :pagination="{
        current: query.page,
        pageSize: query.pageSize,
        total: articleStore.total,
        showSizeChanger: true,
        showTotal: (total: number) => `共 ${total} 篇文章`
      }"
        :row-key="(r: any) => r.id"
        :row-selection="{
        selectedRowKeys,
        onChange: (keys: string[]) => (selectedRowKeys = keys as string[])
      }"
        @change="handleTableChange"
        size="middle">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'title'">
          <!--          // 跳转到客户端文章详情页-->
          <!--          function handleGoToArticle(record: any) {-->
          <!--          window.open(`${CLIENT_BASE_URL}/article/${record.id}`, '_blank')-->
          <!--          }-->

          <a :href="`${CLIENT_BASE_URL}/article/${record.id}`" target="_blank">{{ record.title }}</a>
        </template>
        <template v-if="column.key === 'cover'">
          <a-image v-if="record.cover" :src="record.cover"
                   style="width: 48px; height: 38px; object-fit: cover; border-radius: 4px; cursor: pointer"
          />
          <span v-else>无</span>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="primary" size="small" @click="() => router.push(`/articles/${record.id}/edit`)"> 编辑
            </a-button>
            <a-button danger size="small" @click="handleDelete(record.id, record.title)"> 删除</a-button>
          </a-space>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'published' ? 'green' : 'default'">
            {{ record.status === 'published' ? '已发布' : '草稿' }}
          </a-tag>
        </template>
      </template>
    </a-table>
    <a-modal v-model:open="coverPreviewVisible" title="封面预览" :footer="null" width="600px"
             @cancel="coverPreviewVisible = false">
      <img :src="coverPreviewUrl" style="width: 100%; border-radius: 4px"/>
    </a-modal>
  </div>
</template>
