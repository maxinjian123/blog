<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import api from '@/utils/api'
import { message, Modal } from 'ant-design-vue'
import {
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SaveOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'

interface BackupRecord {
  id: string
  filename: string
  type: 'manual' | 'scheduled' | 'upload'
  operator: string
  remark: string
  size: number
  created_at: string
  tables: number
  rows: number
  duration_ms: number
  restored_at: string | null
  restored_by: string | null
  database: string
}

interface ScheduleConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'interval'
  time: string
  weekday: number
  interval_minutes: number
  last_run_at: string | null
  next_run_at: string | null
  updated_at: string | null
}

const records = ref<BackupRecord[]>([])
const loading = ref(false)
const creating = ref(false)
const restoring = ref(false)
const uploading = ref(false)
const savingSchedule = ref(false)
const total = ref(0)

const stats = ref({
  total: 0,
  total_size: 0,
  last_backup_at: null as string | null,
  last_backup_name: null as string | null,
  storage_dir: '',
  schedule: null as ScheduleConfig | null
})

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  type: undefined as string | undefined,
  dateRange: undefined as any
})

const schedule = ref<ScheduleConfig>({
  enabled: false,
  frequency: 'daily',
  time: '03:00',
  weekday: 1,
  interval_minutes: 60,
  last_run_at: null,
  next_run_at: null,
  updated_at: null
})

const weekdayOptions = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' }
]

const typeOptions = [
  { value: 'manual', label: '手动备份' },
  { value: 'scheduled', label: '定时备份' },
  { value: 'upload', label: '上传备份' }
]

const columns = [
  {
    title: '备份文件',
    dataIndex: 'filename',
    key: 'filename',
    ellipsis: true,
    customRender: ({ text }: { text: string }) => text
  },
  { title: '类型', key: 'type', dataIndex: 'type', width: 100, align: 'center' as const },
  {
    title: '大小',
    dataIndex: 'size',
    key: 'size',
    width: 100,
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => formatBytes(text)
  },
  {
    title: '数据量',
    key: 'volume',
    width: 110,
    align: 'center' as const,
    customRender: ({ record }: { record: BackupRecord }) =>
        `${record.tables || 0} 表 / ${record.rows || 0} 行`
  },
  {
    title: '操作人',
    dataIndex: 'operator',
    key: 'operator',
    width: 110,
    customRender: ({ text }: { text: string }) => text || '-'
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    customRender: ({ text }: { text: string }) =>
        text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'
  },
  {
    title: '恢复记录',
    key: 'restored',
    width: 160,
    customRender: ({ record }: { record: BackupRecord }) =>
        record.restored_at ? `${dayjs(record.restored_at).format('YYYY-MM-DD HH:mm')} ${record.restored_by || ''}` : '-'
  },
  { title: '操作', key: 'action', width: 190, align: 'center' as const, fixed: 'right' as const }
]

function formatBytes(bytes: number) {
  if (!bytes && bytes !== 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function typeColor(type: string) {
  return { manual: 'blue', scheduled: 'green', upload: 'orange' }[type] || 'default'
}

function typeLabel(type: string) {
  return typeOptions.find((t) => t.value === type)?.label || type
}

function buildFilters(): Record<string, any> {
  const params: Record<string, any> = {}
  if (query.keyword) params.keyword = query.keyword
  if (query.type) params.type = query.type
  if (query.dateRange && query.dateRange.length === 2) {
    params.startDate = dayjs(query.dateRange[0]).format('YYYY-MM-DD')
    params.endDate = dayjs(query.dateRange[1]).format('YYYY-MM-DD')
  }
  return params
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: query.page, pageSize: query.pageSize, ...buildFilters() }
    const res: any = await api.get('/backups', { params })
    records.value = res.data?.list || []
    total.value = res.data?.pagination?.total ?? res.data?.total ?? 0
  } catch {
    message.error('加载备份列表失败')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res: any = await api.get('/backups/stats')
    stats.value = res.data || stats.value
  } catch {
    // 忽略统计加载失败
  }
}

async function loadSchedule() {
  try {
    const res: any = await api.get('/backups/schedule')
    if (res.data) {
      schedule.value = { ...schedule.value, ...res.data }
    }
  } catch {
    // 使用默认值
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.type = undefined
  query.dateRange = undefined
  query.page = 1
  loadData()
}

function handleTableChange(pag: { current: number; pageSize: number }) {
  query.page = pag.current
  query.pageSize = pag.pageSize
  loadData()
}

async function handleCreateBackup() {
  if (creating.value) return
  creating.value = true
  try {
    const res: any = await api.post('/backups', {})
    message.success(res.message || '备份创建成功')
    loadData()
    loadStats()
  } catch {
    message.error('备份创建失败')
  } finally {
    creating.value = false
  }
}

async function handleDownload(record: BackupRecord) {
  try {
    const res: any = await api.get(`/backups/${encodeURIComponent(record.id)}/download`, {
      responseType: 'blob'
    })
    const blob = new Blob([res as any], {
      type: 'application/octet-stream'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = record.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('下载已开始')
  } catch {
    message.error('下载失败')
  }
}

function handleRestore(record: BackupRecord) {
  Modal.confirm({
    title: '确认恢复备份',
    icon: h(ExclamationCircleOutlined),
    content: h('div', { style: 'margin-top: 16px' }, [
      h('p', { style: 'margin-bottom: 8px; color: var(--color-text-secondary)' },
          `即将使用备份文件 ${record.filename} 覆盖当前数据库全部数据，此操作不可撤销。`),
      h('p', { style: 'color: #ff4d4f; font-size: 12px; margin: 0' }, '建议先下载备份文件，并在恢复前停止写入操作。')
    ]),
    okText: '确认恢复',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      if (restoring.value) return
      restoring.value = true
      try {
        const res: any = await api.post(`/backups/${encodeURIComponent(record.id)}/restore`)
        message.success(res.message || '备份恢复成功')
        loadData()
        loadStats()
      } catch {
        message.error('备份恢复失败')
      } finally {
        restoring.value = false
      }
    }
  })
}

function handleDelete(record: BackupRecord) {
  Modal.confirm({
    title: '确认删除备份',
    icon: h(ExclamationCircleOutlined),
    content: `确定要删除备份文件 ${record.filename} 吗？删除后不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await api.delete(`/backups/${encodeURIComponent(record.id)}`)
        message.success('备份文件已删除')
        loadData()
        loadStats()
      } catch {
        message.error('删除失败')
      }
    }
  })
}

function handleUploadRestore(file: File): boolean {
  if (uploading.value) return false
  Modal.confirm({
    title: '上传备份并恢复',
    icon: h(ExclamationCircleOutlined),
    content: h('div', { style: 'margin-top: 16px' }, [
      h('p', { style: 'margin-bottom: 8px; color: var(--color-text-secondary)' },
          `即将上传 ${file.name} 并覆盖当前数据库全部数据，此操作不可撤销。`),
      h('p', { style: 'color: #ff4d4f; font-size: 12px; margin: 0' }, '请确认文件来源可信，建议先手动下载一份当前数据备份。')
    ]),
    okText: '上传并恢复',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      uploading.value = true
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res: any = await api.post('/backups/restore-upload', formData)
        message.success(res.message || '备份恢复成功')
        loadData()
        loadStats()
      } catch {
        message.error('上传恢复失败')
      } finally {
        uploading.value = false
      }
    }
  })
  return false
}

function handleTimeChange(time: any) {
  schedule.value.time = time ? time.format('HH:mm') : '03:00'
}

async function handleSaveSchedule() {
  savingSchedule.value = true
  try {
    const res: any = await api.put('/backups/schedule', { ...schedule.value })
    schedule.value = { ...schedule.value, ...res.data }
    message.success('定时备份配置已保存')
    loadStats()
  } catch {
    message.error('保存定时备份配置失败')
  } finally {
    savingSchedule.value = false
  }
}

onMounted(() => {
  loadData()
  loadStats()
  loadSchedule()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>数据备份</h2>
      <a-space>
        <a-upload
            :show-upload-list="false"
            :before-upload="handleUploadRestore"
            accept=".sql,.gz"
        >
          <a-button :loading="uploading">
            <template #icon><CloudUploadOutlined /></template>
            上传备份并恢复
          </a-button>
        </a-upload>
        <a-button type="primary" :loading="creating" @click="handleCreateBackup">
          <template #icon><PlusOutlined /></template>
          立即备份
        </a-button>
      </a-space>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]" style="margin-bottom: 16px">
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="备份总数" :value="stats.total" :value-style="{ color: '#1677ff' }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic title="占用空间" :value="formatBytes(stats.total_size)" :value-style="{ color: '#722ed1' }" />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic
              title="最近备份"
              :value="stats.last_backup_at ? dayjs(stats.last_backup_at).format('MM-DD HH:mm') : '暂无'"
              :value-style="{ color: '#52c41a' }"
          />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="6">
        <a-card>
          <a-statistic
              title="下次定时备份"
              :value="schedule.enabled && schedule.next_run_at ? dayjs(schedule.next_run_at).format('MM-DD HH:mm') : '未开启'"
              :value-style="{ color: schedule.enabled ? '#fa8c16' : '#8c8c8c' }"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 定时备份配置 -->
    <a-card title="定时备份配置" style="margin-bottom: 16px" :body-style="{ paddingBottom: '12px' }">
      <a-space wrap :size="[16, 16]" align="center">
        <a-space>
          <span class="filter-label">开启定时备份</span>
          <a-switch v-model:checked="schedule.enabled" />
        </a-space>

        <a-space v-if="schedule.enabled">
          <span class="filter-label">频率</span>
          <a-radio-group v-model:value="schedule.frequency">
            <a-radio-button value="daily">每天</a-radio-button>
            <a-radio-button value="weekly">每周</a-radio-button>
            <a-radio-button value="interval">每隔</a-radio-button>
          </a-radio-group>
        </a-space>

        <a-space v-if="schedule.enabled && schedule.frequency !== 'interval'">
          <span class="filter-label">执行时间</span>
          <a-time-picker
              :value="dayjs(schedule.time, 'HH:mm')"
              format="HH:mm"
              :minute-step="5"
              @change="handleTimeChange"
          />
        </a-space>

        <a-space v-if="schedule.enabled && schedule.frequency === 'weekly'">
          <span class="filter-label">星期</span>
          <a-select v-model:value="schedule.weekday" style="width: 110px" :options="weekdayOptions" />
        </a-space>

        <a-space v-if="schedule.enabled && schedule.frequency === 'interval'">
          <span class="filter-label">间隔</span>
          <a-input-number
              v-model:value="schedule.interval_minutes"
              :min="5"
              :max="1440"
              :step="5"
              style="width: 120px"
          />
          <span>分钟</span>
        </a-space>

        <a-button type="primary" :loading="savingSchedule" @click="handleSaveSchedule">
          <template #icon><SaveOutlined /></template>
          保存配置
        </a-button>
      </a-space>
    </a-card>

    <!-- 筛选栏 -->
    <a-card style="margin-bottom: 16px" :body-style="{ paddingBottom: '12px' }">
      <a-space wrap :size="[12, 12]">
        <div class="filter-field">
          <span class="filter-label">文件名</span>
          <a-input
              v-model:value="query.keyword"
              placeholder="模糊搜索"
              style="width: 180px"
              allow-clear
              @press-enter="handleSearch"
          />
        </div>
        <div class="filter-field">
          <span class="filter-label">类型</span>
          <a-select
              v-model:value="query.type"
              placeholder="全部"
              style="width: 130px"
              allow-clear
              :options="typeOptions"
          />
        </div>
        <div class="filter-field">
          <span class="filter-label">时间范围</span>
          <a-range-picker v-model:value="query.dateRange" style="width: 240px" />
        </div>
        <a-divider type="vertical" />
        <a-button type="primary" @click="handleSearch">
          <template #icon><SearchOutlined /></template>
          查询
        </a-button>
        <a-button @click="handleReset">
          <template #icon><ReloadOutlined /></template>
          重置
        </a-button>
      </a-space>
    </a-card>

    <a-table
        :columns="(columns as any)"
        :data-source="records"
        :loading="loading"
        :pagination="{
          current: query.page,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 个备份`
        }"
        :row-key="(r: any) => r.id"
        @change="handleTableChange"
        size="middle"
        :scroll="{ x: 1200 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag :color="typeColor(record.type)">{{ typeLabel(record.type) }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space :size="0">
            <a-button size="small" type="link" @click="handleDownload(record)">
              <template #icon><DownloadOutlined /></template>
              下载
            </a-button>
            <a-button size="small" type="link" danger :loading="restoring" @click="handleRestore(record)">
              恢复
            </a-button>
            <a-button size="small" type="link" danger @click="handleDelete(record)">
              <template #icon><DeleteOutlined /></template>
              删除
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.filter-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  white-space: nowrap;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
