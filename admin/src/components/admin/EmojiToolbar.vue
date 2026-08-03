<script setup lang="ts">
import {Emoji} from '@vavt/v3-extension'
import '@vavt/v3-extension/lib/asset/Emoji.css'
import EMOJI_LIST from '@/constants/emojis'

withDefaults(defineProps<{
  title?: string
  selectAfterInsert?: boolean
}>(), {
  title: '表情',
  selectAfterInsert: true
})
</script>

<template>
  <Emoji
      :title="title"
      :select-after-insert="selectAfterInsert"
      :emojis="EMOJI_LIST"
  />
</template>
