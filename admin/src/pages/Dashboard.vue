<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import { Card, Row, Col, Statistic, Tag, Spin, List, ListItem, ListItemMeta, Space, Button } from 'ant-design-vue'
import { FileTextOutlined, EyeOutlined, CommentOutlined, LikeOutlined, AppstoreOutlined, TagsOutlined, RiseOutlined } from '@ant-design/icons-vue'
import { useDashboardStore } from '@/stores/dashboard'
import api from '@/utils/api'

const dashboardStore = useDashboardStore()

// 图表数据
const sourceStats = ref({ search: 0, social: 0, direct: 0, other: 0 })
const deviceStats = ref({ mobile: 0, tablet: 0, pc: 0 })
const hourlyStats = ref<number[]>([])

// 图表实例
const sourceChartRef = ref<HTMLElement | null>(null)
const deviceChartRef = ref<HTMLElement | null>(null)
const hourlyChartRef = ref<HTMLElement | null>(null)

let sourceChart: echarts.ECharts | null = null
let deviceChart: echarts.ECharts | null = null
let hourlyChart: echarts.ECharts | null = null

// 计算属性
const maxBarValue = computed(() => {
  const vals = dashboardStore.stats.weekly_views
  return vals.length > 0 ? Math.max(...vals, 1) : 1
})

const hasWeeklyData = computed(() => {
  return dashboardStore.stats.weekly_views.reduce((sum, v) => sum + v, 0) > 0
})

const weeklyDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

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

// 初始化来源分布饼图
const initSourceChart = () => {
  if (!sourceChartRef.value) return
  
  if (sourceChart) {
    sourceChart.dispose()
  }
  
  sourceChart = echarts.init(sourceChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        name: '访客来源',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['65%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: sourceStats.value.search, name: '搜索引擎', itemStyle: { color: '#5470c6' } },
          { value: sourceStats.value.social, name: '社交媒体', itemStyle: { color: '#91cc75' } },
          { value: sourceStats.value.direct, name: '直接访问', itemStyle: { color: '#fac858' } },
          { value: sourceStats.value.other, name: '其他来源', itemStyle: { color: '#ee6666' } }
        ]
      }
    ]
  }
  
  sourceChart.setOption(option)
}

// 初始化设备分布饼图
const initDeviceChart = () => {
  if (!deviceChartRef.value) return
  
  if (deviceChart) {
    deviceChart.dispose()
  }
  
  deviceChart = echarts.init(deviceChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        name: '设备类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['65%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: deviceStats.value.pc, name: '桌面端', itemStyle: { color: '#5470c6' } },
          { value: deviceStats.value.mobile, name: '移动端', itemStyle: { color: '#91cc75' } },
          { value: deviceStats.value.tablet, name: '平板端', itemStyle: { color: '#fac858' } }
        ]
      }
    ]
  }
  
  deviceChart.setOption(option)
}

// 初始化24小时活跃时段柱状图
const initHourlyChart = () => {
  if (!hourlyChartRef.value) return
  
  if (hourlyChart) {
    hourlyChart.dispose()
  }
  
  hourlyChart = echarts.init(hourlyChartRef.value)
  
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: {
        interval: 2,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '访问量',
        type: 'bar',
        data: hourlyStats.value,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 0.7, color: '#2378f7' },
              { offset: 1, color: '#83bff6' }
            ])
          }
        },
        barWidth: '60%'
      }
    ]
  }
  
  hourlyChart.setOption(option)
}

// 跳转到客户端文章详情页
function handleGoToArticle(record: any) {
  window.open(`http://localhost:5173/article/${record.id}`, '_blank')
}

// 窗口大小变化时重新调整图表
const handleResize = () => {
  sourceChart?.resize()
  deviceChart?.resize()
  hourlyChart?.resize()
}

onMounted(async () => {
  await dashboardStore.fetchStats()
  await Promise.all([
    fetchSourceStats(),
    fetchDeviceStats(),
    fetchHourlyStats()
  ])
  
  // 初始化图表
  initSourceChart()
  initDeviceChart()
  initHourlyChart()
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  sourceChart?.dispose()
  deviceChart?.dispose()
  hourlyChart?.dispose()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>仪表盘</h2>
    </div>

    <Spin :spinning="dashboardStore.loading">
      <Row :gutter="[16, 16]">
        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card">
            <Statistic title="文章总数" :value="dashboardStore.stats.article_count">
              <template #prefix>
                <FileTextOutlined style="color: #1677ff" />
              </template>
            </Statistic>
            <div style="margin-top: 8px; display: flex; gap: 16px">
              <Tag color="green">已发布 {{ dashboardStore.stats.published_count }}</Tag>
              <Tag color="default">草稿 {{ dashboardStore.stats.draft_count }}</Tag>
            </div>
          </Card>
        </Col>

        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card">
            <Statistic title="总访问量" :value="dashboardStore.stats.total_views">
              <template #prefix>
                <EyeOutlined style="color: #52c41a" />
              </template>
            </Statistic>
            <div style="margin-top: 8px">
              <Tag color="blue">
                <RiseOutlined />
                今日 {{ dashboardStore.stats.today_views }}
              </Tag>
            </div>
          </Card>
        </Col>

        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card">
            <Statistic title="评论总数" :value="dashboardStore.stats.comment_count">
              <template #prefix>
                <CommentOutlined style="color: #faad14" />
              </template>
            </Statistic>
          </Card>
        </Col>

        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card">
            <Statistic title="获赞总数" :value="dashboardStore.stats.total_likes">
              <template #prefix>
                <LikeOutlined style="color: #ff4d4f" />
              </template>
            </Statistic>
          </Card>
        </Col>
      </Row>

      <Row :gutter="[16, 16]" style="margin-top: 16px">
        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card">
            <Statistic title="分类数量" :value="dashboardStore.stats.category_count">
              <template #prefix>
                <AppstoreOutlined style="color: #722ed1" />
              </template>
            </Statistic>
          </Card>
        </Col>

        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card">
            <Statistic title="标签数量" :value="dashboardStore.stats.tag_count">
              <template #prefix>
                <TagsOutlined style="color: #13c2c2" />
              </template>
            </Statistic>
          </Card>
        </Col>
      </Row>

      <Row :gutter="[16, 16]" style="margin-top: 16px">
        <Col :xs="24" :lg="16">
          <Card title="近7天访问量" class="chart-container">
            <div class="chart-bars">
              <template v-if="hasWeeklyData">
                <div v-for="(val, i) in dashboardStore.stats.weekly_views" :key="i" class="chart-bar-wrapper" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end">
                  <div class="chart-bar" :style="{ height: `${Math.max((val / maxBarValue) * 160, 4)}px` }">
                    <span class="chart-bar-value">{{ val }}</span>
                    <span class="chart-bar-label">{{ weeklyDays[i] }}</span>
                  </div>
                </div>
              </template>
              <div v-else style="display: flex; align-items: center; justify-content: center; width: 100%; height: 160px; color: rgba(0, 0, 0, 0.45)">暂无数据</div>
            </div>
          </Card>
        </Col>

        <Col :xs="24" :lg="8">
          <Card title="热门文章 TOP5" :body-style="{ padding: '12px' }">
            <List :data-source="dashboardStore.stats.top_articles" size="small">
              <template #renderItem="{ item, index }">
                <ListItem>
                  <Space>
                    <Tag :color="index < 3 ? 'red' : 'default'">{{ index + 1 }}</Tag>
                    <Button type="link" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block" @click="handleGoToArticle(item)">{{ item.title }}</Button>
                  </Space>
                  <template #extra>
                    <span style="color: rgba(0, 0, 0, 0.45); font-size: 13px"> <EyeOutlined /> {{ item.view_count }} </span>
                  </template>
                </ListItem>
              </template>
            </List>
          </Card>
        </Col>
      </Row>

      <!-- 新增：访客分析图表 -->
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

.chart-container {
  min-height: 240px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 180px;
  padding: 16px 8px 0;
  gap: 8px;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.chart-bar {
  width: 100%;
  max-width: 40px;
  background: linear-gradient(180deg, #1890ff 0%, #69c0ff 100%);
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 4px;
}

.chart-bar:hover {
  background: linear-gradient(180deg, #40a9ff 0%, #91d5ff 100%);
  transform: translateY(-2px);
}

.chart-bar-value {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.chart-bar-label {
  position: absolute;
  bottom: -24px;
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
  white-space: nowrap;
}
</style>
