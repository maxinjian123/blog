<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import api from '@/utils/api'
import { message, Modal } from 'ant-design-vue'
import { ExclamationCircleOutlined, SearchOutlined, MailOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'

interface Subscriber {
  id: number
  email: string
  status: 'pending' | 'active' | 'unsubscribed'
  token: string
  ip: string | null
  created_at: string
  updated_at: string
}

const subscribers = ref<Subscriber[]>([])
const loading = ref(false)
const total = ref(0)

const stats = ref({ total: 0, active: 0, pending: 0, unsubscribed: 0 })

const query = reactive({
  page: 1,
  pageSize: 20,
  status: undefined as 'pending' | 'active' | 'unsubscribed' | undefined,
  keyword: ''
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '邮箱', dataIndex: 'email', key: 'email', ellipsis: true },
  {
    title: '状态',
    key: 'status',
    dataIndex: 'status',
    width: 100,
    align: 'center' as const
  },
  {
    title: 'IP',
    dataIndex: 'ip',
    key: 'ip',
    width: 130,
    customRender: ({ text }: { text: string | null }) => text || '-'
  },
  {
    title: '订阅时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    customRender: ({ text }: { text: string }) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'
  },
  { title: '操作', key: 'action', width: 100 }
]

async function loadData() {
  loading.value = true
  try {
    const params: any = { ...query }
    if (params.status === undefined) delete params.status
    if (!params.keyword) delete params.keyword
    const res: any = await api.get('/subscribers/admin', { params })
    const data = res.data?.data || res.data
    subscribers.value = data?.list || data?.rows || []
    total.value = data?.total || data?.count || 0
  } catch {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res: any = await api.get('/subscribers/admin/stats')
    const data = res.data?.data || res.data
    stats.value = data || stats.value
  } catch { /* ignore */ }
}

function handleDelete(record: Subscriber) {
  Modal.confirm({
    title: '确认删除',
    icon: h(ExclamationCircleOutlined),
    content: `确定要删除订阅者 ${record.email} 吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await api.delete(`/subscribers/${record.id}`)
        message.success('删除成功')
        loadData()
        loadStats()
      } catch {
        message.error('删除失败')
      }
    }
  })
}

function handleTableChange(pag: { current: number; pageSize: number }) {
  query.page = pag.current
  query.pageSize = pag.pageSize
  loadData()
}

const statusColor: Record<string, string> = {
  active: 'green',
  pending: 'orange',
  unsubscribed: 'default'
}

const statusText: Record<string, string> = {
  active: '已确认',
  pending: '待确认',
  unsubscribed: '已退订'
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>邮件订阅管理</h2>
      <a-space>
        <a-input-search
          v-model:value="query.keyword"
          placeholder="搜索邮箱..."
          style="width: 220px"
          allow-clear
          @search="() => { query.page = 1; loadData() }"
        >
          <template #enterButton>
            <SearchOutlined />
          </template>
        </a-input-search>
        <a-select
          v-model:value="query.status"
          placeholder="订阅状态"
          style="width: 120px"
          allow-clear
          @change="() => { query.page = 1; loadData() }"
        >
          <a-select-option value="active">已确认</a-select-option>
          <a-select-option value="pending">待确认</a-select-option>
          <a-select-option value="unsubscribed">已退订</a-select-option>
        </a-select>
      </a-space>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]" style="margin-bottom: 16px">
      <a-col :xs="12" :sm="6">
        <a-card class="stat-card">
          <a-statistic title="总订阅" :value="stats.total">
            <template #prefix><MailOutlined style="color: #1677ff" /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card class="stat-card">
          <a-statistic title="已确认" :value="stats.active" :value-style="{ color: '#52c41a' }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card class="stat-card">
          <a-statistic title="待确认" :value="stats.pending" :value-style="{ color: '#faad14' }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card class="stat-card">
          <a-statistic title="已退订" :value="stats.unsubscribed" :value-style="{ color: '#8c8c8c' }" />
        </a-card>
      </a-col>
    </a-row>

    <a-table
      :columns="(columns as any)"
      :data-source="subscribers"
      :loading="loading"
      :pagination="{
        current: query.page,
        pageSize: query.pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t: number) => `共 ${t} 条`
      }"
      :row-key="(r: any) => r.id"
      @change="handleTableChange"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="statusColor[record.status]">{{ statusText[record.status] }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button size="small" type="link" danger @click="handleDelete(record)">删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.stat-card {
  height: 100%;
}
</style>
