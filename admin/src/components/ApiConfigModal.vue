<template>
  <a-modal
    v-model:open="visible"
    :mask-closable="false"
    :closable="false"
    :keyboard="false"
    title="配置后端服务地址"
    ok-text="保存并连接"
    cancel-text="退出"
    :confirm-loading="loading"
    :cancel-button-props="{ danger: true }"
    @ok="handleSave"
    @cancel="handleExit"
    width="520px"
  >
    <div class="config-modal-body">
      <a-alert
        message="首次使用需要配置后端 API 地址，桌面端将通过此地址连接到您的后端服务。"
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />

      <a-form layout="vertical">
        <a-form-item label="后端服务地址" required>
          <a-input
            v-model:value="apiUrl"
            placeholder="http://192.168.1.100:3000 或 https://api.example.com"
            allow-clear
            size="large"
          >
            <template #prefix>
              <ApiOutlined />
            </template>
          </a-input>
          <div class="form-help">
            请填写后端服务的完整地址（含端口），无需加 /api/v1 后缀
          </div>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" block :loading="testing" @click="handleTest">
            测试连接
          </a-button>
          <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'fail'">
            <CheckCircleFilled v-if="testResult.success" />
            <CloseCircleFilled v-else />
            {{ testResult.message }}
          </div>
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { ApiOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons-vue'
import { applyApiBaseUrl, isElectron } from '@/utils/api'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'configured'): void
  (e: 'exit'): void
}>()

const visible = ref(props.open)
const apiUrl = ref('')
const loading = ref(false)
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

// 监听 props.open 变化
import { watch } from 'vue'
watch(() => props.open, (val) => { visible.value = val })

// 测试连接
async function handleTest() {
  if (!apiUrl.value.trim()) {
    message.warning('请输入后端服务地址')
    return
  }
  testing.value = true
  testResult.value = null
  try {
    const cleanUrl = apiUrl.value.trim().replace(/\/+$/, '')
    // 直接请求健康检查接口
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${cleanUrl}/api/v1/site/health`, {
      signal: controller.signal
    })
    clearTimeout(timer)
    if (res.ok) {
      testResult.value = { success: true, message: '连接成功，后端服务可用' }
    } else {
      testResult.value = { success: false, message: `后端响应异常：HTTP ${res.status}` }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      testResult.value = { success: false, message: '连接超时（5秒无响应）' }
    } else {
      testResult.value = { success: false, message: `连接失败：${err.message}` }
    }
  } finally {
    testing.value = false
  }
}

// 保存配置
async function handleSave() {
  if (!apiUrl.value.trim()) {
    message.warning('请输入后端服务地址')
    return
  }
  loading.value = true
  try {
    const cleanUrl = apiUrl.value.trim().replace(/\/+$/, '')
    // 保存到 Electron 主进程配置文件
    if (isElectron) {
      const ok = await (window as any).electronAPI.setApiBaseUrl(cleanUrl)
      if (!ok) {
        message.error('配置保存失败')
        return
      }
    }
    // 应用到 axios 实例
    await applyApiBaseUrl(cleanUrl)
    message.success('配置已保存')
    visible.value = false
    emit('configured')
  } catch (err: any) {
    message.error('保存失败：' + err.message)
  } finally {
    loading.value = false
  }
}

// 退出应用
function handleExit() {
  emit('exit')
}
</script>

<style scoped>
.config-modal-body {
  padding: 0;
}

.form-help {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.test-result {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.test-result.success {
  color: #52c41a;
}

.test-result.fail {
  color: #ff4d4f;
}
</style>
