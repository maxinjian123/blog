<script setup lang="ts">
import {useAuthStore} from '@/stores/auth'
import MusicPlayer from '@/components/MusicPlayer.vue'
import ApiConfigModal from '@/components/ApiConfigModal.vue'
import {LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined} from '@ant-design/icons-vue'
import menuItems from '@/nav'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import {computed, onMounted, ref, watch} from 'vue'
import api, {loadApiBaseUrlFromElectron, isElectron} from '@/utils/api'

import {useRoute, useRouter} from 'vue-router'

dayjs.locale('zh-cn')

const locale = ref(zhCN)

// 企业级中后台视觉规范：收敛圆角，保持专业简洁
const antdTheme = {
  token: {
    borderRadius: 4,
    colorPrimary: '#1677ff'
  }
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

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
  // 桌面端：从主进程加载后端地址，若未配置则弹窗
  if (isElectron) {
    const url = await loadApiBaseUrlFromElectron()
    if (!url) {
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
  // if (path === '/') {
  //   selectedKeys.value = ['/']
  // } else if (path.startsWith('/articles')) {
  //   selectedKeys.value = ['/articles']
  // } else if (path.startsWith('/categories')) {
  //   selectedKeys.value = ['/categories']
  // } else if (path.startsWith('/tags')) {
  //   selectedKeys.value = ['/tags']
  // } else if (path.startsWith('/comments')) {
  //   selectedKeys.value = ['/comments']
  // } else if (path.startsWith('/guestbook')) {
  //   selectedKeys.value = ['/guestbook']
  // } else if (path.startsWith('/announcements')) {
  //   selectedKeys.value = ['/announcements']
  // } else if (path.startsWith('/links')) {
  //   selectedKeys.value = ['/links']
  // } else if (path.startsWith('/media')) {
  //   selectedKeys.value = ['/media']
  // } else if (path.startsWith('/crawler')) {
  //   selectedKeys.value = ['/crawler']
  // } else if (path.startsWith('/music')) {
  //   selectedKeys.value = ['/music']
  // } else if (path.startsWith('/subscribers')) {
  //   selectedKeys.value = ['/subscribers']
  // } else if (path.startsWith('/settings')) {
  //   selectedKeys.value = ['/settings']
  // }
}

watch(() => route.path, updateSelectedKeys, {immediate: true})

function handleMenuClick({key}: { key: string }) {
  router.push(key)
}

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}

const isLoginPage = computed(() => route.path === '/login')
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
        <a-layout-content class="admin-content">
          <router-view/>
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
  min-height: 100vh;
}

.admin-sider {
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.06);
  z-index: 10;
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
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
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
}

.user-info {
  cursor: pointer;
}

.admin-content {
  margin: 20px;
  padding: 24px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: auto;
  height: calc(100vh - 104px);
}

.login-layout {
  min-height: 100vh;
}

.app-loading-placeholder {
  min-height: 100vh;
  background: #f5f5f5;
}
</style>
