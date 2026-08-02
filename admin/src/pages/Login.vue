<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import api from '@/utils/api'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const formState = reactive({
  username: '',
  password: ''
})

// 站点信息（动态从后端读取 logo 与名称）
const siteInfo = ref<{ site_name: string; site_logo: string }>({ site_name: '', site_logo: './logo.svg' })

async function fetchSiteInfo() {
  try {
    const res: any = await api.get('/site/info')
    const data = res.data || res
    siteInfo.value = {
      site_name: data?.site_name || '管理后台',
      site_logo: data?.site_logo || './logo.svg'
    }
  } catch {
    // 静默失败
  }
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(formState.username, formState.password)
    message.success('登录成功')
    router.push('/')
  } catch (err: any) {
    message.error(err?.response?.data?.message || err?.message || '登录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSiteInfo()
})
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <img :src="siteInfo.site_logo" alt="logo" class="login-logo" />
        <h2>{{ siteInfo.site_name }} 管理后台</h2>
        <p>请登录以继续</p>
      </div>
      <a-form
        :model="formState"
        :rules="rules"
        name="login"
        autocomplete="off"
        @finish="handleLogin"
        layout="vertical"
        size="large"
      >
        <a-form-item name="username">
          <a-input
            v-model:value="formState.username"
            placeholder="用户名"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="password">
          <a-input-password
            v-model:value="formState.password"
            placeholder="密码"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            block
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0d1b2a 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
}

.login-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}
</style>