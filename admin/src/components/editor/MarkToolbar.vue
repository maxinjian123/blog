<script setup lang="ts">
import {Mark} from '@vavt/v3-extension'
import '@vavt/v3-extension/lib/asset/Mark.css'

withDefaults(defineProps<{
  title?: string
}>(), {
  title: '标记'
})
</script>

<template>
  <Mark v-bind="$attrs" :title="title"/>
</template>
