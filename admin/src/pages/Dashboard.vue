<script setup lang="ts">
import { CLIENT_BASE_URL } from '@/config.ts'
import { useDashboardStore } from '@/stores/dashboard'
import { AppstoreOutlined, CommentOutlined, EyeOutlined, FileTextOutlined, LikeOutlined, RiseOutlined, TagsOutlined } from '@ant-design/icons-vue'
import { computed, onMounted } from 'vue'

const dashboardStore = useDashboardStore()

const weeklyDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const maxBarValue = computed(() => {
  const vals = dashboardStore.stats.weekly_views
  return vals.length > 0 ? Math.max(...vals, 1) : 1
})

const hasWeeklyData = computed(() => {
  return dashboardStore.stats.weekly_views.reduce((sum, v) => sum + v, 0) > 0
})

// 跳转到客户端文章详情页
function handleGoToArticle(record: any) {
  window.open(`${CLIENT_BASE_URL}/article/${record.id}`, '_blank')
}

onMounted(() => {
  dashboardStore.fetchStats()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>仪表盘</h2>
    </div>

    <a-spin :spinning="dashboardStore.loading">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="stat-card">
            <a-statistic title="文章总数" :value="dashboardStore.stats.article_count">
              <template #prefix>
                <FileTextOutlined style="color: #1677ff" />
              </template>
            </a-statistic>
            <div style="margin-top: 8px; display: flex; gap: 16px">
              <a-tag color="green">已发布 {{ dashboardStore.stats.published_count }}</a-tag>
              <a-tag color="default">草稿 {{ dashboardStore.stats.draft_count }}</a-tag>
            </div>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="stat-card">
            <a-statistic title="总访问量" :value="dashboardStore.stats.total_views">
              <template #prefix>
                <EyeOutlined style="color: #52c41a" />
              </template>
            </a-statistic>
            <div style="margin-top: 8px">
              <a-tag color="blue">
                <RiseOutlined />
                今日 {{ dashboardStore.stats.today_views }}
              </a-tag>
            </div>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="stat-card">
            <a-statistic title="评论总数" :value="dashboardStore.stats.comment_count">
              <template #prefix>
                <CommentOutlined style="color: #faad14" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="stat-card">
            <a-statistic title="获赞总数" :value="dashboardStore.stats.total_likes">
              <template #prefix>
                <LikeOutlined style="color: #ff4d4f" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="stat-card">
            <a-statistic title="分类数量" :value="dashboardStore.stats.category_count">
              <template #prefix>
                <AppstoreOutlined style="color: #722ed1" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="stat-card">
            <a-statistic title="标签数量" :value="dashboardStore.stats.tag_count">
              <template #prefix>
                <TagsOutlined style="color: #13c2c2" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col :xs="24" :lg="16">
          <a-card title="近7天访问量" class="chart-container">
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
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="8">
          <a-card title="热门文章 TOP5" :body-style="{ padding: '12px' }">
            <a-list :data-source="dashboardStore.stats.top_articles" size="small">
              <template #renderItem="{ item, index }">
                <a-list-item>
                  <a-space>
                    <a-tag :color="index < 3 ? 'red' : 'default'">{{ index + 1 }}</a-tag>
                    <a-button type="link" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block" @click="handleGoToArticle(item)">{{ item.title }}</a-button>
                  </a-space>
                  <template #extra>
                    <span style="color: rgba(0, 0, 0, 0.45); font-size: 13px"> <EyeOutlined /> {{ item.view_count }} </span>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="最新评论" :body-style="{ padding: '12px' }">
            <a-list :data-source="dashboardStore.stats.recent_comments" size="small">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>
                      <a-space>
                        <strong>{{ item.username }}</strong>
                        <span style="color: rgba(0, 0, 0, 0.45)">评论了</span>
                        <a-tag color="blue">{{ item.article_title }}</a-tag>
                      </a-space>
                    </template>
                    <template #description>
                      {{ item.content }}
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>
