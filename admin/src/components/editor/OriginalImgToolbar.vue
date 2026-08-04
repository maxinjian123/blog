<script setup lang="ts">
import {OriginalImg} from '@vavt/v3-extension'
import '@vavt/v3-extension/lib/asset/OriginalImg.css'

withDefaults(defineProps<{
  title?: string
}>(), {
  title: '查看原图'
})
</script>

<template>
  <OriginalImg v-bind="$attrs" :title="title"/>
</template>
