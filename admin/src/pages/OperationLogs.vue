<script setup lang="ts">
import {computed, h, onMounted, onUnmounted, nextTick, reactive, ref, watch} from 'vue'
import api from '@/utils/api'
import {message, Modal, DatePicker} from 'ant-design-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import {
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'

interface OperationLog {
  id: string
  user_id: string | null
  username: string | null
  module: string
  action: string
  target_id: string | null
  target_name: string | null
  method: string
  path: string
  ip: string
  user_agent: string
  status: 'success' | 'fail'
  status_code: number
  error_msg: string | null
  duration: number
  request_body: string | null
  createdAt: string
}

// 模块中文标签
const moduleLabels: Record<string, string> = {
  article: '文章',
  comment: '评论',
  link: '友链',
  media: '媒体',
  music: '音乐',
  playlist: '播放列表',
  announcement: '公告',
  config: '系统配置',
  user: '用户',
  auth: '认证',
  image_crawler: '图片抓取',
  crawler: '爬虫',
  guestbook: '留言板',
  operation_log: '操作日志'
}

// 模块 a-tag 颜色（antd 预设色）
const moduleColors: Record<string, string> = {
  article: 'blue',
  comment: 'cyan',
  link: 'geekblue',
  media: 'purple',
  music: 'magenta',
  playlist: 'pink',
  announcement: 'orange',
  config: 'gold',
  user: 'green',
  auth: 'red',
  image_crawler: 'lime',
  crawler: 'volcano',
  guestbook: 'yellow',
  operation_log: 'default'
}

// 模块进度条颜色（真实 CSS 色值）
const moduleHex: Record<string, string> = {
  article: '#1677ff',
  comment: '#13c2c2',
  link: '#2f54eb',
  media: '#722ed1',
  music: '#eb2f96',
  playlist: '#ff7a45',
  announcement: '#fa8c16',
  config: '#faad14',
  user: '#52c41a',
  auth: '#f5222d',
  image_crawler: '#a0d911',
  crawler: '#fa541c',
  guestbook: '#fadb14',
  operation_log: '#8c8c8c'
}

// 操作类型中文标签
const actionLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  publish: '发布',
  audit: '审核',
  login: '登录',
  logout: '登出',
  download: '下载',
  cleanup: '清理',
  upload: '上传',
  import: '导入'
}

// 操作类型 a-tag 颜色
const actionColors: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  publish: 'cyan',
  audit: 'orange',
  login: 'geekblue',
  logout: 'geekblue',
  download: 'purple',
  cleanup: 'volcano',
  upload: 'magenta',
  import: 'gold'
}

// 操作类型进度条颜色
const actionHex: Record<string, string> = {
  create: '#52c41a',
  update: '#1677ff',
  delete: '#f5222d',
  publish: '#13c2c2',
  audit: '#fa8c16',
  login: '#2f54eb',
  logout: '#597ef7',
  download: '#722ed1',
  cleanup: '#fa541c',
  upload: '#eb2f96',
  import: '#faad14'
}

const moduleOptions = Object.keys(moduleLabels).map(k => ({value: k, label: moduleLabels[k]}))
const actionOptions = Object.keys(actionLabels).map(k => ({value: k, label: actionLabels[k]}))

function moduleLabel(m: string) {
  return moduleLabels[m] || m
}

function moduleColor(m: string) {
  return moduleColors[m] || 'default'
}

function actionLabel(a: string) {
  return actionLabels[a] || a
}

function actionColor(a: string) {
  return actionColors[a] || 'blue'
}

// ===== 列表 =====
const activeTab = ref<'list' | 'stats'>('list')
const logs = ref<OperationLog[]>([])
const loading = ref(false)
const total = ref(0)
const exporting = ref(false)

const query = reactive({
  page: 1,
  pageSize: 10,
  module: undefined as string | undefined,
  action: undefined as string | undefined,
  status: undefined as string | undefined,
  username: '',
  dateRange: undefined as any
})

const columns = [
  {
    title: '时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 170,
    customRender: ({text}: { text: string }) =>
        text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'
  },
  {
    title: '操作者',
    dataIndex: 'username',
    key: 'username',
    width: 120,
    customRender: ({text}: { text: string | null }) => text || '-'
  },
  {title: '模块', key: 'module', dataIndex: 'module', width: 110, align: 'center' as const},
  {title: '操作', key: 'action', dataIndex: 'action', width: 90, align: 'center' as const},
  {
    title: '目标名称',
    dataIndex: 'target_name',
    key: 'target_name',
    width: 180,
    ellipsis: true,
    customRender: ({text}: { text: string | null }) => text || '-'
  },
  {title: '方法', dataIndex: 'method', key: 'method', width: 90, align: 'center' as const},
  {
    title: 'IP',
    dataIndex: 'ip',
    key: 'ip',
    width: 130,
    customRender: ({text}: { text: string }) => text || '-'
  },
  {title: '状态', key: 'status', dataIndex: 'status', width: 90, align: 'center' as const},
  {
    title: '耗时',
    dataIndex: 'duration',
    key: 'duration',
    width: 100,
    align: 'right' as const,
    customRender: ({text}: { text: number }) => `${text}ms`
  },
  {title: '操作', key: 'action_btn', width: 90, align: 'center' as const, fixed: 'right' as const}
]

function buildFilters(): Record<string, any> {
  const params: Record<string, any> = {}
  if (query.module) params.module = query.module
  if (query.action) params.action = query.action
  if (query.status) params.status = query.status
  if (query.username) params.username = query.username
  if (query.dateRange && query.dateRange.length === 2) {
    params.startDate = dayjs(query.dateRange[0]).format('YYYY-MM-DD')
    params.endDate = dayjs(query.dateRange[1]).format('YYYY-MM-DD')
  }
  return params
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {page: query.page, pageSize: query.pageSize, ...buildFilters()}
    const res: any = await api.get('/operation-logs', {params})
    logs.value = res.data?.list || []
    total.value = res.data?.pagination?.total ?? res.data?.total ?? 0
  } catch {
    message.error('加载日志列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.module = undefined
  query.action = undefined
  query.status = undefined
  query.username = ''
  query.dateRange = undefined
  query.page = 1
  loadData()
}

function handleTableChange(pag: { current: number; pageSize: number }) {
  query.page = pag.current
  query.pageSize = pag.pageSize
  loadData()
}

// ===== 详情 =====
const drawerVisible = ref(false)
const detailLoading = ref(false)
const currentDetail = ref<OperationLog | null>(null)

async function handleViewDetail(record: OperationLog) {
  drawerVisible.value = true
  detailLoading.value = true
  currentDetail.value = record
  try {
    const res: any = await api.get(`/operation-logs/${record.id}`)
    if (res.data) {
      currentDetail.value = res.data
    }
  } catch {
    // 使用列表中的数据
  } finally {
    detailLoading.value = false
  }
}

function formatJson(str: string | null): string {
  if (!str) return ''
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

// ===== 导出 =====
async function handleExport() {
  if (exporting.value) return
  exporting.value = true
  message.loading({content: '正在导出...', key: 'export', duration: 0})
  try {
    const params: any = {format: 'csv', limit: 1000, ...buildFilters()}
    const res: any = await api.get('/operation-logs/export/data', {params, responseType: 'blob'})
    const blob = new Blob([res as any], {type: 'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `operation-logs-${dayjs().format('YYYYMMDD-HHmmss')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success({content: '导出成功', key: 'export'})
  } catch {
    message.error({content: '导出失败', key: 'export'})
  } finally {
    exporting.value = false
  }
}

// ===== 清理 =====
const cleanupDate = ref(dayjs().subtract(30, 'day'))

function handleCleanup() {
  cleanupDate.value = dayjs().subtract(30, 'day')
  Modal.confirm({
    title: '清理操作日志',
    icon: h(ExclamationCircleOutlined),
    content: () => h('div', {style: 'margin-top: 16px'}, [
      h('p', {style: 'margin-bottom: 12px; color: var(--color-text-secondary)'},
          '将清理以下日期之前的所有操作日志，此操作不可恢复：'),
      h(DatePicker, {
        value: cleanupDate.value,
        'onUpdate:value': (v: any) => {
          cleanupDate.value = v
        },
        style: 'width: 100%',
        allowClear: false,
        format: 'YYYY-MM-DD'
      }),
      h('p', {style: 'margin-top: 12px; color: #ff4d4f; font-size: 12px'}, '请谨慎操作！')
    ]),
    okText: '确认清理',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      const beforeDate = cleanupDate.value.format('YYYY-MM-DD')
      try {
        const res: any = await api.delete('/operation-logs/cleanup', {params: {beforeDate}})
        message.success(`已清理 ${res.data?.deleted ?? 0} 条日志`)
        loadData()
      } catch {
        message.error('清理失败')
      }
    }
  })
}

// ===== 统计看板 =====
const statsDays = ref(7)
const statsLoading = ref(false)
const stats = ref<{
  days: number
  total: number
  totalFail: number
  failRate: string
  trend: Array<{ date: string; count: number; success: number; fail: number }>
  moduleDist: Array<{ module: string; count: number }>
  actionDist: Array<{ action: string; count: number }>
  topUsers: Array<{ username: string; count: number }>
}>({
  days: 7,
  total: 0,
  totalFail: 0,
  failRate: '0',
  trend: [],
  moduleDist: [],
  actionDist: [],
  topUsers: []
})

const trendChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null

const moduleDistTotal = computed(() =>
    stats.value.moduleDist.reduce((s, m) => s + m.count, 0) || 1
)
const actionDistTotal = computed(() =>
    stats.value.actionDist.reduce((s, a) => s + a.count, 0) || 1
)

async function loadStats() {
  statsLoading.value = true
  try {
    const res: any = await api.get('/operation-logs/stats/overview', {params: {days: statsDays.value}})
    if (res.data) {
      stats.value = res.data
    }
  } catch {
    message.error('加载统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

function initTrendChart() {
  if (!trendChartRef.value) return
  if (trendChart) trendChart.dispose()
  trendChart = echarts.init(trendChartRef.value)
  const trend = stats.value.trend || []
  trendChart.setOption({
    tooltip: {trigger: 'axis', axisPointer: {type: 'shadow'}},
    legend: {data: ['成功', '失败'], top: 0},
    grid: {left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true},
    xAxis: {type: 'category', data: trend.map(t => t.date)},
    yAxis: {type: 'value', minInterval: 1},
    series: [
      {
        name: '成功',
        type: 'bar',
        stack: 'total',
        data: trend.map(t => t.success),
        itemStyle: {color: '#52c41a'}
      },
      {
        name: '失败',
        type: 'bar',
        stack: 'total',
        data: trend.map(t => t.fail),
        itemStyle: {color: '#ff4d4f'}
      }
    ]
  })
}

async function refreshStats() {
  await loadStats()
  await nextTick()
  initTrendChart()
}

// 切换到统计看板时首次加载
watch(activeTab, async (v) => {
  if (v === 'stats') {
    await refreshStats()
  }
})

// 切换统计天数时重新加载
watch(statsDays, async () => {
  if (activeTab.value === 'stats') {
    await refreshStats()
  }
})

function handleResize() {
  trendChart?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>操作日志</h2>
    </div>

    <a-tabs v-model:activeKey="activeTab">
      <!-- 日志列表 -->
      <a-tab-pane key="list" tab="日志列表">
        <!-- 筛选栏 -->
        <a-card style="margin-bottom: 16px" :body-style="{paddingBottom: '12px'}">
          <a-space wrap :size="[12, 12]">
            <div class="filter-field">
              <span class="filter-label">模块</span>
              <a-select
                  v-model:value="query.module"
                  placeholder="全部"
                  style="width: 140px"
                  allow-clear
                  :options="moduleOptions"
              />
            </div>
            <div class="filter-field">
              <span class="filter-label">操作</span>
              <a-select
                  v-model:value="query.action"
                  placeholder="全部"
                  style="width: 120px"
                  allow-clear
                  :options="actionOptions"
              />
            </div>
            <div class="filter-field">
              <span class="filter-label">状态</span>
              <a-select v-model:value="query.status" placeholder="全部" style="width: 100px" allow-clear>
                <a-select-option value="success">成功</a-select-option>
                <a-select-option value="fail">失败</a-select-option>
              </a-select>
            </div>
            <div class="filter-field">
              <span class="filter-label">操作者</span>
              <a-input
                  v-model:value="query.username"
                  placeholder="模糊搜索"
                  style="width: 150px"
                  allow-clear
                  @press-enter="handleSearch"
              />
            </div>
            <div class="filter-field">
              <span class="filter-label">时间范围</span>
              <a-range-picker v-model:value="query.dateRange" style="width: 240px"/>
            </div>
            <a-divider type="vertical"/>
            <a-button type="primary" @click="handleSearch">
              <template #icon>
                <SearchOutlined/>
              </template>
              查询
            </a-button>
            <a-button @click="handleReset">
              <template #icon>
                <ReloadOutlined/>
              </template>
              重置
            </a-button>
            <a-button :loading="exporting" @click="handleExport">
              <template #icon>
                <DownloadOutlined/>
              </template>
              导出
            </a-button>
            <a-button danger @click="handleCleanup">
              <template #icon>
                <DeleteOutlined/>
              </template>
              清理
            </a-button>
          </a-space>
        </a-card>

        <a-table
            :columns="(columns as any)"
            :data-source="logs"
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
            :scroll="{x: 1350}"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'module'">
              <a-tag :color="moduleColor(record.module)">{{ moduleLabel(record.module) }}</a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-tag :color="actionColor(record.action)">{{ actionLabel(record.action) }}</a-tag>
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === 'success' ? 'green' : 'red'">
                {{ record.status === 'success' ? '成功' : '失败' }}
              </a-tag>
            </template>
            <template v-if="column.key === 'action_btn'">
              <a-button size="small" type="link" @click="handleViewDetail(record)">
                <template #icon>
                  <EyeOutlined/>
                </template>
                详情
              </a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>

      <!-- 统计看板 -->
      <a-tab-pane key="stats" tab="统计看板">
        <a-spin :spinning="statsLoading">
          <div style="margin-bottom: 16px">
            <a-radio-group v-model:value="statsDays">
              <a-radio-button :value="7">近7天</a-radio-button>
              <a-radio-button :value="30">近30天</a-radio-button>
              <a-radio-button :value="90">近90天</a-radio-button>
            </a-radio-group>
          </div>

          <!-- 顶部统计卡片 -->
          <a-row :gutter="[16, 16]" style="margin-bottom: 16px">
            <a-col :xs="12" :sm="6">
              <a-card>
                <a-statistic title="总操作数" :value="stats.total" :value-style="{color: '#1677ff'}"/>
              </a-card>
            </a-col>
            <a-col :xs="12" :sm="6">
              <a-card>
                <a-statistic title="失败数" :value="stats.totalFail" :value-style="{color: '#ff4d4f'}"/>
              </a-card>
            </a-col>
            <a-col :xs="12" :sm="6">
              <a-card>
                <a-statistic
                    title="失败率"
                    :value="Number(stats.failRate)"
                    :precision="1"
                    suffix="%"
                    :value-style="{color: '#faad14'}"
                />
              </a-card>
            </a-col>
            <a-col :xs="12" :sm="6">
              <a-card>
                <a-statistic title="统计天数" :value="stats.days" suffix="天"/>
              </a-card>
            </a-col>
          </a-row>

          <!-- 每日操作趋势 -->
          <a-card title="每日操作趋势" style="margin-bottom: 16px">
            <div v-if="stats.trend.length > 0" ref="trendChartRef" style="width: 100%; height: 300px"></div>
            <div v-else class="empty-tip">暂无数据</div>
          </a-card>

          <a-row :gutter="[16, 16]">
            <!-- 模块分布 -->
            <a-col :xs="24" :lg="12">
              <a-card title="模块分布" style="margin-bottom: 16px">
                <div v-if="stats.moduleDist.length > 0">
                  <div v-for="m in stats.moduleDist" :key="m.module" class="dist-item">
                    <div class="dist-label">
                      <a-tag :color="moduleColor(m.module)">{{ moduleLabel(m.module) }}</a-tag>
                    </div>
                    <a-progress
                        :percent="(m.count / moduleDistTotal) * 100"
                        :stroke-color="moduleHex[m.module] || '#1677ff'"
                        :format="() => String(m.count)"
                    />
                  </div>
                </div>
                <div v-else class="empty-tip">暂无数据</div>
              </a-card>
            </a-col>

            <!-- 操作类型分布 -->
            <a-col :xs="24" :lg="12">
              <a-card title="操作类型分布" style="margin-bottom: 16px">
                <div v-if="stats.actionDist.length > 0">
                  <div v-for="a in stats.actionDist" :key="a.action" class="dist-item">
                    <div class="dist-label">
                      <a-tag :color="actionColor(a.action)">{{ actionLabel(a.action) }}</a-tag>
                    </div>
                    <a-progress
                        :percent="(a.count / actionDistTotal) * 100"
                        :stroke-color="actionHex[a.action] || '#1677ff'"
                        :format="() => String(a.count)"
                    />
                  </div>
                </div>
                <div v-else class="empty-tip">暂无数据</div>
              </a-card>
            </a-col>
          </a-row>

          <!-- 高频操作者 TOP 10 -->
          <a-card title="高频操作者 TOP 10">
            <a-list :data-source="stats.topUsers" size="small">
              <template #renderItem="{ item, index }">
                <a-list-item>
                  <a-space>
                    <a-tag :color="index < 3 ? 'red' : 'default'">{{ index + 1 }}</a-tag>
                    <span>{{ item.username || '未知' }}</span>
                  </a-space>
                  <template #extra>
                    <span class="top-user-count">{{ item.count }} 次</span>
                  </template>
                </a-list-item>
              </template>
            </a-list>
            <div v-if="stats.topUsers.length === 0" class="empty-tip">暂无数据</div>
          </a-card>
        </a-spin>
      </a-tab-pane>
    </a-tabs>

    <!-- 详情抽屉 -->
    <a-drawer
        v-model:open="drawerVisible"
        title="操作日志详情"
        width="640"
        :destroy-on-close="true"
    >
      <a-spin :spinning="detailLoading">
        <a-descriptions v-if="currentDetail" :column="2" bordered size="small">
          <a-descriptions-item label="日志ID" :span="2">{{ currentDetail.id }}</a-descriptions-item>
          <a-descriptions-item label="操作者">{{ currentDetail.username || '-' }}</a-descriptions-item>
          <a-descriptions-item label="用户ID">{{ currentDetail.user_id || '-' }}</a-descriptions-item>
          <a-descriptions-item label="模块">
            <a-tag :color="moduleColor(currentDetail.module)">{{ moduleLabel(currentDetail.module) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="操作">
            <a-tag :color="actionColor(currentDetail.action)">{{ actionLabel(currentDetail.action) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="目标ID">{{ currentDetail.target_id || '-' }}</a-descriptions-item>
          <a-descriptions-item label="目标名称">{{ currentDetail.target_name || '-' }}</a-descriptions-item>
          <a-descriptions-item label="请求方法">{{ currentDetail.method }}</a-descriptions-item>
          <a-descriptions-item label="状态码">{{ currentDetail.status_code }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="currentDetail.status === 'success' ? 'green' : 'red'">
              {{ currentDetail.status === 'success' ? '成功' : '失败' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="耗时">{{ currentDetail.duration }}ms</a-descriptions-item>
          <a-descriptions-item label="IP">{{ currentDetail.ip || '-' }}</a-descriptions-item>
          <a-descriptions-item label="请求路径" :span="2">{{ currentDetail.path }}</a-descriptions-item>
          <a-descriptions-item label="错误信息" :span="2">
            <span v-if="currentDetail.error_msg" style="color: #ff4d4f">{{ currentDetail.error_msg }}</span>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="User-Agent" :span="2">{{ currentDetail.user_agent || '-' }}</a-descriptions-item>
          <a-descriptions-item label="时间" :span="2">
            {{ currentDetail.createdAt ? dayjs(currentDetail.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="请求体" :span="2">
            <pre v-if="currentDetail.request_body" class="json-pre">{{ formatJson(currentDetail.request_body) }}</pre>
            <span v-else>-</span>
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>
    </a-drawer>
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

.dist-item {
  margin-bottom: 14px;
}

.dist-item:last-child {
  margin-bottom: 0;
}

.dist-label {
  margin-bottom: 4px;
}

.empty-tip {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: 24px 0;
}

.json-pre {
  background: var(--color-bg-fill);
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.top-user-count {
  color: var(--color-text-tertiary);
  font-size: 13px;
}
</style>
