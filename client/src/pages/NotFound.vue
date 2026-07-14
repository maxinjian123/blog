<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <lay-card class="blog-card">
    <lay-empty description="页面未找到">
      <lay-button type="primary" @click="router.push('/')">返回首页</lay-button>
    </lay-empty>
  </lay-card>
</template>
