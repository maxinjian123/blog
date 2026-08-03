<script setup lang="ts">
import {useAuthStore} from '@/stores/auth'
import MusicPlayer from '@/components/MusicPlayer.vue'
import ApiConfigModal from '@/components/ApiConfigModal.vue'
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbFilled,
  BulbOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import menuItems from '@/nav'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import {theme} from 'ant-design-vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import {computed, onMounted, ref, watch} from 'vue'
import api, {loadApiBaseUrlFromElectron, isElectron} from '@/utils/api'
import {initClientBaseUrl} from '@/config/config'

import {useRoute, useRouter} from 'vue-router'
import TabsNav from '@/components/admin/TabsNav.vue'
import {useTabsStore} from '@/stores/tabs'
import {useDarkMode} from '@/composables/useDarkMode'

dayjs.locale('zh-cn')

const locale = ref(zhCN)

// 企业级中后台视觉规范：收敛圆角，保持专业简洁
// 暗黑模式：依据 antdv 官方 custom-theme 方案，通过 ConfigProvider 的 theme.algorithm 切换
const {isDark, toggleDarkMode} = useDarkMode()

const antdTheme = computed(() => ({
  algorithm: isDark.value ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    borderRadius: 4,
    colorPrimary: '#1677ff'
  }
}))

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const tabsStore = useTabsStore()

const collapsed = ref(false)
const selectedKeys = ref<string[]>([])

// 桌面端首次启动配置弹窗
const configModalVisible = ref(false)
const appReady = ref(!isElectron)  // Web 端直接就绪

// 站点信息（从后台动态加载 logo 与名称，不再硬编码）
const siteInfo = ref<{ site_name: string; site_logo: string }>({site_name: '', site_logo: ''})

async function fetchSiteInfo() {
  try {
    const res: any = await api.get('/site/info')
    const data = res.data || res
    siteInfo.value = {
      site_name: data?.site_name || '',
      site_logo: data?.site_logo || './logo.svg'
    }
    // 同步浏览器标题与 favicon
    if (data?.site_name) document.title = `${data.site_name} 管理后台`
    if (data?.site_logo) updateFavicon(data.site_logo)
  } catch {
    // 静默失败，使用默认 logo
  }
}

function updateFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = href
}

onMounted(async () => {
  // 桌面端：并行加载客户端访问地址与后端 API 地址
  if (isElectron) {
    const [, backendUrl] = await Promise.all([
      initClientBaseUrl(),
      loadApiBaseUrlFromElectron()
    ])
    if (!backendUrl) {
      configModalVisible.value = true
      return  // 未配置前不加载站点信息
    }
  }
  appReady.value = true
  fetchSiteInfo()
})

// 配置完成后重新加载
function handleConfigured() {
  appReady.value = true
  fetchSiteInfo()
}

// 退出应用
function handleExitApp() {
  if (isElectron) {
    window.close()
  }
}

// 切换到设置页时刷新站点信息（保存 logo/名称后回到 App 可即时反映）
watch(() => route.path, (p) => {
  if (p === '/' || p === '/settings') fetchSiteInfo()
})


function updateSelectedKeys() {
  const path = route.path
  selectedKeys.value = [path]
}

watch(() => route.path, updateSelectedKeys, {immediate: true})

// 路由完成确认后登记标签页（覆盖首屏导航与后续所有切换）
router.afterEach((to) => {
  tabsStore.addTab(to)
})

function handleMenuClick({key}: { key: string }) {
  router.push(key)
}

async function handleLogout() {
  authStore.logout()
  tabsStore.reset()
  await router.push('/login')
}

const isLoginPage = computed(() => route.path === '/login')
const isEditorPage = computed(() => route.name === 'ArticleCreate' || route.name === 'ArticleEdit')
</script>

<template>
  <a-config-provider :locale="locale" :theme="antdTheme">
    <!-- 桌面端首次启动配置弹窗 -->
    <ApiConfigModal
      :open="configModalVisible"
      @configured="handleConfigured"
      @exit="handleExitApp"
    />
    <!-- 桌面端未就绪时显示加载占位 -->
    <div v-if="!appReady" class="app-loading-placeholder"></div>
    <template v-else>
    <div v-if="isLoginPage" class="login-layout">
      <router-view/>
    </div>
    <a-layout v-else class="admin-layout">
      <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible class="admin-sider">
        <div class="logo">
          <img :src="siteInfo.site_logo || './logo.svg'" alt="logo" class="logo-img"/>
          <span v-show="!collapsed" class="logo-text">{{ siteInfo.site_name || '管理后台' }}</span>
        </div>
        <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline" :items="menuItems"
                @click="handleMenuClick"/>
      </a-layout-sider>
      <a-layout>
        <a-layout-header class="admin-header">
          <div class="header-left">
            <component :is="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined" class="trigger"
                       @click="collapsed = !collapsed"/>
          </div>
          <div class="header-right">
            <a-tooltip :title="isDark ? '切换为亮色' : '切换为暗色'">
              <a-button
                  type="text"
                  class="theme-toggle-btn"
                  :aria-label="isDark ? '切换为亮色' : '切换为暗色'"
                  @click="toggleDarkMode"
              >
                <template #icon>
                  <BulbFilled v-if="isDark"/>
                  <BulbOutlined v-else/>
                </template>
              </a-button>
            </a-tooltip>
            <a-dropdown>
              <a-space class="user-info">
                <a-avatar size="default" :src="authStore.user?.avatar || ''">
                  <template #icon>
                    <UserOutlined/>
                  </template>
                </a-avatar>
                <span>{{ authStore.user?.nickname || '管理员' }}</span>
              </a-space>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="/profile" @click="router.push('/profile')">
                    <UserOutlined/>
                    <span style="margin-left: 8px">个人信息</span>
                  </a-menu-item>
                  <a-menu-item key="logout" @click="handleLogout">
                    <LogoutOutlined/>
                    <span style="margin-left: 8px">退出登录</span>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </a-layout-header>
        <TabsNav/>
        <a-layout-content class="admin-content" :class="{'admin-content--flush': isEditorPage}">
          <router-view v-if="!tabsStore.reloadFlag" v-slot="{ Component, route: routeView }">
            <keep-alive :include="tabsStore.cachedViews">
              <component :is="Component" :key="routeView.fullPath"/>
            </keep-alive>
          </router-view>
        </a-layout-content>
      </a-layout>
    </a-layout>
    <!-- 全局音乐播放器（底部播放条 + 最小化悬浮球） -->
    <MusicPlayer/>
    </template>
  </a-config-provider>
</template>

<style scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.admin-sider {
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.06);
  z-index: 10;
  overflow: hidden;
}

.admin-sider :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.admin-sider :deep(.ant-menu) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-img {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

.admin-header {
  background: var(--color-bg-container);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-header);
  z-index: 9;
}

.header-left .trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.header-left .trigger:hover {
  color: #1677ff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-toggle-btn {
  font-size: 16px;
  color: var(--color-text);
}

.user-info {
  cursor: pointer;
}

.admin-content {
  margin: 12px;
  padding: 14px;
  background: var(--color-bg-container);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.admin-content--flush {
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  overflow: hidden;
}

.login-layout {
  min-height: 100vh;
}

.app-loading-placeholder {
  min-height: 100vh;
  background: var(--color-bg-layout);
}
</style>
