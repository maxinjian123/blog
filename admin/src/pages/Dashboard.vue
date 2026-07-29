<script setup lang="ts">
import {computed, onMounted, onUnmounted, reactive, ref} from 'vue'
import * as echarts from 'echarts'
import {Button, Card, Col, List, ListItem, ListItemMeta, Row, Space, Spin, Statistic, Tag, Table} from 'ant-design-vue'
import {
  AppstoreOutlined,
  CommentOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FileTextOutlined,
  LikeOutlined,
  RiseOutlined,
  TagsOutlined
} from '@ant-design/icons-vue'
import {useDashboardStore} from '@/stores/dashboard'
import api from '@/utils/api'
import CountUp from '@/components/CountUp.vue'
import dayjs from 'dayjs'

const dashboardStore = useDashboardStore()

// 图表数据
const sourceStats = ref({search: 0, social: 0, direct: 0, other: 0})
const deviceStats = ref({mobile: 0, tablet: 0, pc: 0})
const hourlyStats = ref<number[]>([])
const locationStats = ref<{
  provinces: Array<{ name: string; value: number }>;
  cities: Array<{ province: string; city: string; value: number }>
}>({provinces: [], cities: []})

// 最近访客明细
const recentVisitors = ref<Array<{
  id: number
  ip: string
  province: string
  city: string
  article_title: string
  user_agent: string
  created_at: string
}>>([])
const visitorLoading = ref(false)
const visitorTotal = ref(0)
const visitorQuery = reactive({page: 1, pageSize: 10})

// 图表实例引用
const weeklyChartRef = ref<HTMLElement | null>(null)
const sourceChartRef = ref<HTMLElement | null>(null)
const deviceChartRef = ref<HTMLElement | null>(null)
const hourlyChartRef = ref<HTMLElement | null>(null)
const mapChartRef = ref<HTMLElement | null>(null)

let weeklyChart: echarts.ECharts | null = null
let sourceChart: echarts.ECharts | null = null
let deviceChart: echarts.ECharts | null = null
let hourlyChart: echarts.ECharts | null = null
let mapChart: echarts.ECharts | null = null
let chinaGeoNames: string[] = []

// 近7天日期标签
const weeklyDays = computed(() => {
  return Array.from({length: 7}, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return i === 6 ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`
  })
})

// 展示用的城市 TOP10
const topCities = computed(() => {
  return locationStats.value.cities
      .filter(c => c.city && c.city !== '未知' && c.province !== '本地')
      .slice(0, 10)
})

// 最近访客表格列
const visitorColumns = [
  {
    title: 'IP',
    dataIndex: 'ip',
    key: 'ip',
    width: 130,
    customRender: ({text}: { text: string }) => text || '-'
  },
  {
    title: '省份',
    dataIndex: 'province',
    key: 'province',
    width: 100,
    customRender: ({text}: { text: string }) => text || '未知'
  },
  {
    title: '城市',
    dataIndex: 'city',
    key: 'city',
    width: 100,
    customRender: ({text}: { text: string }) => text || '未知'
  },
  {
    title: '访问页面',
    dataIndex: 'article_title',
    key: 'article_title',
    ellipsis: true
  },
  {
    title: '访问时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    customRender: ({text}: { text: string }) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'
  }
]

// 获取最近访客明细
const fetchRecentVisitors = async () => {
  visitorLoading.value = true
  try {
    const res: any = await api.get('/admin/stats/recent-visitors', {
      params: {page: visitorQuery.page, pageSize: visitorQuery.pageSize}
    })
    // 后端 paginated() 返回 { list, pagination: { total, ... } }
    const data = res.data || res
    recentVisitors.value = data?.list || []
    visitorTotal.value = data?.pagination?.total ?? data?.total ?? 0
  } catch (error) {
    console.error('获取最近访客失败:', error)
  } finally {
    visitorLoading.value = false
  }
}

function handleVisitorTableChange(pag: { current: number; pageSize: number }) {
  visitorQuery.page = pag.current
  visitorQuery.pageSize = pag.pageSize
  fetchRecentVisitors()
}

// 获取访客来源统计
const fetchSourceStats = async () => {
  try {
    const res: any = await api.get('/admin/stats/source')
    sourceStats.value = res.data || res
  } catch (error) {
    console.error('获取来源统计失败:', error)
  }
}

// 获取设备分布统计
const fetchDeviceStats = async () => {
  try {
    const res: any = await api.get('/admin/stats/device')
    deviceStats.value = res.data || res
  } catch (error) {
    console.error('获取设备统计失败:', error)
  }
}

// 获取24小时活跃时段
const fetchHourlyStats = async () => {
  try {
    const res: any = await api.get('/admin/stats/hourly')
    hourlyStats.value = res.data || res
  } catch (error) {
    console.error('获取时段统计失败:', error)
  }
}

// 获取访客地域分布（近30天）
const fetchLocationStats = async () => {
  try {
    const res: any = await api.get('/admin/stats/location')
    const data = res.data || res
    if (data && Array.isArray(data.provinces)) {
      locationStats.value = data
    }
  } catch (error) {
    console.error('获取地域统计失败:', error)
  }
}

// 初始化近7天访问量 ECharts 柱状图
const initWeeklyChart = () => {
  if (!weeklyChartRef.value) return

  if (weeklyChart) {
    weeklyChart.dispose()
  }

  weeklyChart = echarts.init(weeklyChartRef.value)

  const data = dashboardStore.stats.weekly_views

  weeklyChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {type: 'shadow'},
      formatter: (params: any) => {
        const p = params[0]
        return `${p.axisValue}<br/>访问量：<b>${p.value}</b> 次`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: weeklyDays.value,
      axisLabel: {fontSize: 12}
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '访问量',
        type: 'bar',
        data,
        barWidth: '50%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {offset: 0, color: '#83bff6'},
            {offset: 0.5, color: '#188df0'},
            {offset: 1, color: '#188df0'}
          ]),
          borderRadius: [6, 6, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: '#2378f7'},
              {offset: 0.7, color: '#2378f7'},
              {offset: 1, color: '#83bff6'}
            ])
          }
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          color: '#666',
          formatter: '{c}'
        }
      }
    ]
  })
}

// 初始化访客地域分布中国地图
const initMapChart = async () => {
  if (!mapChartRef.value) return

  if (mapChart) {
    mapChart.dispose()
  }

  mapChart = echarts.init(mapChartRef.value)

  const provinces = locationStats.value.provinces.filter(p => p.name && !['本地', '未知'].includes(p.name))

  try {
    if (chinaGeoNames.length === 0) {
      const resp = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      if (!resp.ok) throw new Error(`地图数据加载失败: ${resp.status}`)
      const geoJson = await resp.json()
      echarts.registerMap('china', geoJson)
      chinaGeoNames = (geoJson.features || []).map((f: any) => f.properties?.name).filter(Boolean)
    }

    const mapData = provinces
        .map(p => {
          const fullName = chinaGeoNames.find(n => n.startsWith(p.name))
          return fullName ? {name: fullName, value: p.value} : null
        })
        .filter((item): item is { name: string; value: number } => item !== null)

    const maxValue = Math.max(...mapData.map(d => d.value), 1)

    mapChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => (params.value >= 0 ? `${params.name}: ${params.value} 次访问` : `${params.name}: 暂无访问`)
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        bottom: 10,
        text: ['高', '低'],
        calculable: true,
        inRange: {
          color: ['#e6f4ff', '#91caff', '#1677ff', '#0958d9']
        }
      },
      series: [
        {
          name: '访问量',
          type: 'map',
          map: 'china',
          roam: true,
          scaleLimit: {min: 0.8, max: 4},
          label: {show: false},
          emphasis: {
            label: {show: true, fontSize: 12},
            itemStyle: {areaColor: '#ffd666'}
          },
          data: mapData
        }
      ]
    })
  } catch (error) {
    console.error('中国地图渲染失败，降级为柱状图:', error)
    mapChart.setOption({
      tooltip: {trigger: 'axis', axisPointer: {type: 'shadow'}},
      grid: {left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true},
      xAxis: {
        type: 'category',
        data: provinces.map(p => p.name),
        axisLabel: {rotate: 45}
      },
      yAxis: {type: 'value', minInterval: 1},
      series: [
        {
          name: '访问量',
          type: 'bar',
          data: provinces.map(p => p.value),
          barWidth: '60%',
          itemStyle: {color: '#1677ff'}
        }
      ]
    })
  }
}

// 初始化来源分布饼图
const initSourceChart = () => {
  if (!sourceChartRef.value) return
  if (sourceChart) sourceChart.dispose()
  sourceChart = echarts.init(sourceChartRef.value)

  sourceChart.setOption({
    tooltip: {trigger: 'item', formatter: '{b}: {c} ({d}%)'},
    legend: {orient: 'vertical', left: 'left', top: 'center'},
    series: [
      {
        name: '访客来源',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['65%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {borderRadius: 10, borderColor: '#fff', borderWidth: 2},
        label: {show: false, position: 'center'},
        emphasis: {label: {show: true, fontSize: 16, fontWeight: 'bold'}},
        labelLine: {show: false},
        data: [
          {value: sourceStats.value.search, name: '搜索引擎', itemStyle: {color: '#5470c6'}},
          {value: sourceStats.value.social, name: '社交媒体', itemStyle: {color: '#91cc75'}},
          {value: sourceStats.value.direct, name: '直接访问', itemStyle: {color: '#fac858'}},
          {value: sourceStats.value.other, name: '其他来源', itemStyle: {color: '#ee6666'}}
        ]
      }
    ]
  })
}

// 初始化设备分布饼图
const initDeviceChart = () => {
  if (!deviceChartRef.value) return
  if (deviceChart) deviceChart.dispose()
  deviceChart = echarts.init(deviceChartRef.value)

  deviceChart.setOption({
    tooltip: {trigger: 'item', formatter: '{b}: {c} ({d}%)'},
    legend: {orient: 'vertical', left: 'left', top: 'center'},
    series: [
      {
        name: '设备类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['65%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {borderRadius: 10, borderColor: '#fff', borderWidth: 2},
        label: {show: false, position: 'center'},
        emphasis: {label: {show: true, fontSize: 16, fontWeight: 'bold'}},
        labelLine: {show: false},
        data: [
          {value: deviceStats.value.pc, name: '桌面端', itemStyle: {color: '#5470c6'}},
          {value: deviceStats.value.mobile, name: '移动端', itemStyle: {color: '#91cc75'}},
          {value: deviceStats.value.tablet, name: '平板端', itemStyle: {color: '#fac858'}}
        ]
      }
    ]
  })
}

// 初始化24小时活跃时段柱状图
const initHourlyChart = () => {
  if (!hourlyChartRef.value) return
  if (hourlyChart) hourlyChart.dispose()
  hourlyChart = echarts.init(hourlyChartRef.value)

  const hours = Array.from({length: 24}, (_, i) => `${i}:00`)

  hourlyChart.setOption({
    tooltip: {trigger: 'axis', axisPointer: {type: 'shadow'}},
    grid: {left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true},
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: {interval: 2, rotate: 45}
    },
    yAxis: {type: 'value', minInterval: 1},
    series: [
      {
        name: '访问量',
        type: 'bar',
        data: hourlyStats.value,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {offset: 0, color: '#83bff6'},
            {offset: 0.5, color: '#188df0'},
            {offset: 1, color: '#188df0'}
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: '#2378f7'},
              {offset: 0.7, color: '#2378f7'},
              {offset: 1, color: '#83bff6'}
            ])
          }
        },
        barWidth: '60%'
      }
    ]
  })
}

// 跳转到客户端文章详情页
function handleGoToArticle(record: any) {
  window.open(`http://localhost:5173/article/${record.id}`, '_blank')
}

// 窗口大小变化时重新调整图表
const handleResize = () => {
  weeklyChart?.resize()
  sourceChart?.resize()
  deviceChart?.resize()
  hourlyChart?.resize()
  mapChart?.resize()
}

onMounted(async () => {
  await dashboardStore.fetchStats()
  await Promise.all([
    fetchSourceStats(),
    fetchDeviceStats(),
    fetchHourlyStats(),
    fetchLocationStats(),
    fetchRecentVisitors()
  ])

  // 初始化图表
  initWeeklyChart()
  initSourceChart()
  initDeviceChart()
  initHourlyChart()
  initMapChart()

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  weeklyChart?.dispose()
  sourceChart?.dispose()
  deviceChart?.dispose()
  hourlyChart?.dispose()
  mapChart?.dispose()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>仪表盘</h2>
    </div>

    <Spin :spinning="dashboardStore.loading">
      <!-- 数据卡片：6个一行，数字滚动动画 -->
      <Row :gutter="[16, 16]">
        <Col :xs="12" :sm="8" :lg="4">
          <Card class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #1677ff, #4096ff)">
              <FileTextOutlined/>
            </div>
            <div class="stat-body">
              <div class="stat-title">文章总数</div>
              <div class="stat-value" style="color: #1677ff">
                <CountUp :value="dashboardStore.stats.article_count"/>
              </div>
              <div class="stat-tags">
                <Tag color="green">已发布 {{ dashboardStore.stats.published_count }}</Tag>
                <Tag color="default">草稿 {{ dashboardStore.stats.draft_count }}</Tag>
              </div>
            </div>
          </Card>
        </Col>

        <Col :xs="12" :sm="8" :lg="4">
          <Card class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #52c41a, #73d13d)">
              <EyeOutlined/>
            </div>
            <div class="stat-body">
              <div class="stat-title">总访问量</div>
              <div class="stat-value" style="color: #52c41a">
                <CountUp :value="dashboardStore.stats.total_views"/>
              </div>
              <div class="stat-tags">
                <Tag color="blue">
                  <RiseOutlined/>
                  今日 <CountUp :value="dashboardStore.stats.today_views" :duration="800"/>
                </Tag>
              </div>
            </div>
          </Card>
        </Col>

        <Col :xs="12" :sm="8" :lg="4">
          <Card class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #faad14, #ffc53d)">
              <CommentOutlined/>
            </div>
            <div class="stat-body">
              <div class="stat-title">评论总数</div>
              <div class="stat-value" style="color: #faad14">
                <CountUp :value="dashboardStore.stats.comment_count"/>
              </div>
              <div class="stat-tags">
                <Tag color="orange">留言 {{ dashboardStore.stats.message_count || 0 }}</Tag>
              </div>
            </div>
          </Card>
        </Col>

        <Col :xs="12" :sm="8" :lg="4">
          <Card class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #ff4d4f, #ff7875)">
              <LikeOutlined/>
            </div>
            <div class="stat-body">
              <div class="stat-title">获赞总数</div>
              <div class="stat-value" style="color: #ff4d4f">
                <CountUp :value="dashboardStore.stats.total_likes"/>
              </div>
              <div class="stat-tags">&nbsp;</div>
            </div>
          </Card>
        </Col>

        <Col :xs="12" :sm="8" :lg="4">
          <Card class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #722ed1, #9254de)">
              <AppstoreOutlined/>
            </div>
            <div class="stat-body">
              <div class="stat-title">分类数量</div>
              <div class="stat-value" style="color: #722ed1">
                <CountUp :value="dashboardStore.stats.category_count"/>
              </div>
              <div class="stat-tags">&nbsp;</div>
            </div>
          </Card>
        </Col>

        <Col :xs="12" :sm="8" :lg="4">
          <Card class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #13c2c2, #36cfc9)">
              <TagsOutlined/>
            </div>
            <div class="stat-body">
              <div class="stat-title">标签数量</div>
              <div class="stat-value" style="color: #13c2c2">
                <CountUp :value="dashboardStore.stats.tag_count"/>
              </div>
              <div class="stat-tags">&nbsp;</div>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 近7天访问量 ECharts 柱状图 + 热门文章 -->
      <Row :gutter="[16, 16]" style="margin-top: 16px">
        <Col :xs="24" :lg="16">
          <Card title="近7天访问量" class="chart-container">
            <div ref="weeklyChartRef" style="width: 100%; height: 300px;"></div>
          </Card>
        </Col>

        <Col :xs="24" :lg="8">
          <Card title="热门文章 TOP5" :body-style="{ padding: '12px' }">
            <List :data-source="dashboardStore.stats.top_articles" size="small">
              <template #renderItem="{ item, index }">
                <ListItem>
                  <Space>
                    <Tag :color="index < 3 ? 'red' : 'default'">{{ index + 1 }}</Tag>
                    <Button type="link"
                            style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block"
                            @click="handleGoToArticle(item)">{{ item.title }}
                    </Button>
                  </Space>
                  <template #extra>
                    <span style="color: rgba(0, 0, 0, 0.45); font-size: 13px">
                      <EyeOutlined/> {{ item.view_count }}
                    </span>
                  </template>
                </ListItem>
              </template>
            </List>
          </Card>
        </Col>
      </Row>

      <!-- 访客分析图表 -->
      <Row :gutter="[16, 16]" style="margin-top: 16px">
        <Col :xs="24" :lg="12">
          <Card title="访客来源分布（近7天）">
            <div ref="sourceChartRef" style="width: 100%; height: 300px;"></div>
          </Card>
        </Col>
        <Col :xs="24" :lg="12">
          <Card title="设备类型分布（近7天）">
            <div ref="deviceChartRef" style="width: 100%; height: 300px;"></div>
          </Card>
        </Col>
      </Row>

      <Row :gutter="[16, 16]" style="margin-top: 16px">
        <Col :span="24">
          <Card title="今日活跃时段分布">
            <div ref="hourlyChartRef" style="width: 100%; height: 300px;"></div>
          </Card>
        </Col>
      </Row>

      <!-- 访客地域分布：中国地图 + 城市 TOP10 -->
      <Row :gutter="[16, 16]" style="margin-top: 16px">
        <Col :xs="24" :lg="16">
          <Card title="访客地域分布（近30天）">
            <div ref="mapChartRef" style="width: 100%; height: 420px;"></div>
          </Card>
        </Col>
        <Col :xs="24" :lg="8">
          <Card title="访客城市 TOP10" :body-style="{ padding: '12px' }">
            <List :data-source="topCities" size="small">
              <template #renderItem="{ item, index }">
                <ListItem>
                  <Space>
                    <Tag :color="index < 3 ? 'red' : 'default'">{{ index + 1 }}</Tag>
                    <span>{{ item.province }} · {{ item.city }}</span>
                  </Space>
                  <template #extra>
                    <span style="color: rgba(0, 0, 0, 0.45); font-size: 13px">{{ item.value }} 次</span>
                  </template>
                </ListItem>
              </template>
            </List>
            <div v-if="topCities.length === 0" style="text-align: center; color: rgba(0, 0, 0, 0.45); padding: 24px 0">
              暂无数据
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 最近访客明细 -->
      <Row :gutter="[16, 16]" style="margin-top: 16px">
        <Col :span="24">
          <Card title="最近访客明细">
            <template #extra>
              <EnvironmentOutlined style="color: #1677ff"/>
              <span style="margin-left: 4px; font-size: 13px; color: rgba(0,0,0,0.45)">含地域信息</span>
            </template>
            <a-table
                :columns="(visitorColumns as any)"
                :data-source="recentVisitors"
                :loading="visitorLoading"
                :pagination="{
                  current: visitorQuery.page,
                  pageSize: visitorQuery.pageSize,
                  total: visitorTotal,
                  showSizeChanger: true,
                  showTotal: (t: number) => `共 ${t} 条`
                }"
                :row-key="(r: any) => r.id"
                size="middle"
                @change="handleVisitorTableChange"
            />
          </Card>
        </Col>
      </Row>

      <!-- 最新评论 -->
      <Row :gutter="[16, 16]" style="margin-top: 16px">
        <Col :span="24">
          <Card title="最新评论" :body-style="{ padding: '12px' }">
            <List :data-source="dashboardStore.stats.recent_comments" size="small">
              <template #renderItem="{ item }">
                <ListItem>
                  <ListItemMeta>
                    <template #title>
                      <Space>
                        <strong>{{ item.username }}</strong>
                        <span style="color: rgba(0, 0, 0, 0.45)">评论了</span>
                        <Tag color="blue">{{ item.article_title }}</Tag>
                      </Space>
                    </template>
                    <template #description>
                      {{ item.content }}
                    </template>
                  </ListItemMeta>
                </ListItem>
              </template>
            </List>
          </Card>
        </Col>
      </Row>
    </Spin>
  </div>
</template>

<style scoped>
.stat-card {
  height: 100%;
}

.stat-card :deep(.ant-card-body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-title {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-tags {
  font-size: 12px;
}

.chart-container {
  min-height: 340px;
}
</style>
