<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {DropdownToolbar} from 'md-editor-v3'
import type {Insert} from 'md-editor-v3'
import {data as qfaceData, getUrl, type Face} from 'qface'
import api from '@/utils/api'
import wechatEmojiIndex from './qface/wechat-emoji-index.json'

/**
 * 通用表情工具栏（客户端版）
 * - 自定义：后端 /emojis 数据库表情（默认）
 * - QQNT 表情库：koishijs/QFace（qface 包），GIF 优先，无 GIF 回退静态 PNG
 * - WeChat Emoji：QFace 官方索引（PNG）
 * - 表情包：后端 /emoji-packs 图片表情包
 * 插入统一使用标准 Markdown 图片语法 ![名称](地址)。
 */

type EmojiTab = 'custom' | 'qqnt' | 'wechat' | 'pack'

interface QFaceEmojiItem {
  id: string
  name: string
  url: string
  fallbackUrl: string
}

interface WechatEmojiItem {
  key: string
  cnValue: string
  qqValue: string
  enValue: string
  fileName: string
  eggIndex: number
  path: string
}

interface EmojiPackItem {
  id: number
  name: string
  url: string
}

const QFACE_BASE = 'https://koishi.js.org/QFace'

const props = withDefaults(defineProps<{
  title?: string
  selectAfterInsert?: boolean
  insert?: Insert
  disabled?: boolean
  showToolbarName?: boolean
  emojiApi?: string
  packApi?: string
  showCustom?: boolean
  showQQNT?: boolean
  showWechat?: boolean
  showPack?: boolean
}>(), {
  title: '表情',
  selectAfterInsert: true,
  emojiApi: '/emojis',
  packApi: '/emoji-packs',
  showCustom: true,
  showQQNT: true,
  showWechat: true,
  showPack: true
})

const visibleTabs = computed<EmojiTab[]>(() => {
  const tabs: EmojiTab[] = []
  if (props.showCustom) tabs.push('custom')
  if (props.showQQNT) tabs.push('qqnt')
  if (props.showWechat) tabs.push('wechat')
  if (props.showPack) tabs.push('pack')
  return tabs
})

const TAB_LABELS: Record<EmojiTab, string> = {
  custom: '自定义',
  qqnt: 'QQNT 表情库',
  wechat: 'WeChat Emoji',
  pack: '表情包'
}

const visible = ref(false)
const activeTab = ref<EmojiTab>('qqnt')
const emojis = ref<string[]>([])
const emojiPacks = ref<EmojiPackItem[]>([])
const failedIds = ref<Set<string>>(new Set())

watch(
    visibleTabs,
    (tabs) => {
      if (!tabs.includes(activeTab.value)) {
        activeTab.value = tabs[0] || 'qqnt'
      }
    },
    {immediate: true}
)

const qqntEmojis = computed<QFaceEmojiItem[]>(() =>
    (qfaceData as Face[])
        .filter((item) => item.QHide !== '1')
        .map((item) => {
          const id = String(item.QSid)
          const officialUrl = getUrl(id, QFACE_BASE)
          return {
            id,
            name: item.QDes.replace(/^\//, '') || `#${id}`,
            url: officialUrl.endsWith('.gif')
                ? officialUrl
                : `${QFACE_BASE}/gif/s${id}.gif`,
            fallbackUrl: `${QFACE_BASE}/static/s${id}.png`
          }
        })
)

const wechatEmojis = computed<QFaceEmojiItem[]>(() =>
    (wechatEmojiIndex as WechatEmojiItem[]).map((item) => {
      const id = String(item.eggIndex)
      return {
        id,
        name: (item.cnValue || item.fileName.replace(/\.png$/i, '')).replace(/[\[\]]/g, ''),
        url: `${QFACE_BASE}/${item.path}`,
        fallbackUrl: ''
      }
    })
)

function emojiUrl(item: QFaceEmojiItem) {
  if (item.fallbackUrl && failedIds.value.has(item.id)) {
    return item.fallbackUrl
  }
  return item.url
}

function handleImgError(item: QFaceEmojiItem) {
  if (item.fallbackUrl) {
    failedIds.value.add(item.id)
    failedIds.value = new Set(failedIds.value)
  }
}

function insertContent(content: string) {
  if (!props.insert) return
  props.insert(() => ({
    targetValue: content,
    select: props.selectAfterInsert,
    deviationStart: 0,
    deviationEnd: 0
  }))
}

function insertEmojiImage(name: string, url: string) {
  // 使用标准 Markdown 图片语法嵌入，并通过属性语法限制展示尺寸
  insertContent(`![${name}](${url}){width=100}`)
}

function insertQFaceEmoji(item: QFaceEmojiItem) {
  insertEmojiImage(item.name, emojiUrl(item))
}

function insertEmojiPack(item: EmojiPackItem) {
  insertEmojiImage(item.name || '表情包', item.url)
}

async function loadEmojis() {
  try {
    const res: any = await api.get(props.emojiApi)
    emojis.value = res.data?.data?.emojis || []
  } catch {
    emojis.value = []
  }
}

async function loadEmojiPacks() {
  try {
    const res: any = await api.get(props.packApi)
    emojiPacks.value = res.data?.data?.list || []
  } catch {
    emojiPacks.value = []
  }
}

function handleVisibleChange(value: boolean) {
  visible.value = value
}

onMounted(() => {
  if (props.showCustom) loadEmojis()
  if (props.showPack) loadEmojiPacks()
})
</script>

<template>
  <DropdownToolbar
      :title="title"
      :visible="visible"
      :disabled="disabled"
      @onChange="handleVisibleChange"
  >
    <template #trigger>
      <svg
          class="emoji-toolbar-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
      <div v-if="showToolbarName" class="md-editor-toolbar-item-name">{{ title }}</div>
    </template>
    <template #overlay>
      <div class="qface-emoji-panel">
        <div class="qface-emoji-panel__body">
          <ul v-if="activeTab === 'custom'" class="qface-emoji-grid">
            <li
                v-for="(emoji, index) in emojis"
                :key="`custom-${index}`"
                class="qface-emoji-cell qface-emoji-cell--text"
                title="点击插入"
                v-html="emoji"
                @click="insertContent(emoji)"
            />
            <li v-if="!emojis.length" class="qface-emoji-empty">暂无自定义表情</li>
          </ul>

          <ul v-else-if="activeTab === 'qqnt'" class="qface-emoji-grid">
            <li
                v-for="item in qqntEmojis"
                :key="`qq-${item.id}`"
                class="qface-emoji-cell"
                :title="item.name"
                @click="insertQFaceEmoji(item)"
            >
              <img :src="emojiUrl(item)" :alt="item.name" loading="lazy" @error="handleImgError(item)"/>
            </li>
          </ul>

          <ul v-else-if="activeTab === 'wechat'" class="qface-emoji-grid">
            <li
                v-for="item in wechatEmojis"
                :key="`wx-${item.id}`"
                class="qface-emoji-cell"
                :title="item.name"
                @click="insertQFaceEmoji(item)"
            >
              <img :src="emojiUrl(item)" :alt="item.name" loading="lazy"/>
            </li>
          </ul>

          <ul v-else class="qface-emoji-grid">
            <li
                v-for="item in emojiPacks"
                :key="`pack-${item.id}`"
                class="qface-emoji-cell"
                :title="item.name || '表情包'"
                @click="insertEmojiPack(item)"
            >
              <img :src="item.url" :alt="item.name || '表情包'" loading="lazy"/>
            </li>
            <li v-if="!emojiPacks.length" class="qface-emoji-empty">暂无表情包</li>
          </ul>
        </div>

        <div class="qface-emoji-panel__tabs" role="tablist">
          <button
              v-for="tab in visibleTabs"
              :key="tab"
              type="button"
              :class="{active: activeTab === tab}"
              role="tab"
              :aria-selected="activeTab === tab"
              @click="activeTab = tab"
          >
            {{ TAB_LABELS[tab] }}
          </button>
        </div>
      </div>
    </template>
  </DropdownToolbar>
</template>

<style scoped>
.qface-emoji-panel {
  display: flex;
  flex-direction: column;
  width: 352px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--md-bk-color-outstand, #fff);
  border: 1px solid var(--md-border-color, #e6e6e6);
}

.qface-emoji-panel__body {
  height: 268px;
  overflow-y: auto;
  padding: 8px;
}

.qface-emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.qface-emoji-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.qface-emoji-cell:hover {
  border-color: var(--md-theme-base-color, #1677ff);
  background: var(--md-hover-color, rgba(22, 119, 255, 0.08));
}

.qface-emoji-cell img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.qface-emoji-cell--text {
  font-size: 24px;
  line-height: 1;
  user-select: none;
}

.qface-emoji-empty {
  grid-column: 1 / -1;
  padding: 36px 0;
  text-align: center;
  font-size: 12px;
  color: var(--md-color, #666);
  opacity: 0.6;
}

.qface-emoji-panel__tabs {
  display: flex;
  border-top: 1px solid var(--md-border-color, #e6e6e6);
  background: var(--md-bk-color, #fff);
}

.qface-emoji-panel__tabs button {
  flex: 1;
  height: 36px;
  border: 0;
  border-right: 1px solid var(--md-border-color, #e6e6e6);
  background: transparent;
  color: var(--md-color, #333);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.qface-emoji-panel__tabs button:last-child {
  border-right: 0;
}

.qface-emoji-panel__tabs button:hover {
  color: var(--md-theme-base-color, #1677ff);
}

.qface-emoji-panel__tabs button.active {
  color: var(--md-theme-base-color, #1677ff);
  background: var(--md-hover-color, rgba(22, 119, 255, 0.08));
  font-weight: 600;
}

.emoji-toolbar-icon {
  vertical-align: middle;
}
</style>
