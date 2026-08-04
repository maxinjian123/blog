<script setup lang="ts">
import {computed, onActivated, onMounted, ref} from 'vue'
import {DropdownToolbar} from 'md-editor-v3'
import type {Insert} from 'md-editor-v3'
import {Smile} from 'lucide-vue-next'
import {data as qfaceData, getUrl, type Face} from 'qface'
import api from '@/utils/api'
import wechatEmojiIndex from './qface/wechat-emoji-index.json'

/**
 * 表情面板：底部 Tab 切换
 * - 自定义：数据库 /emojis 中的表情（管理后台维护）
 * - QQNT 表情库：koishijs/QFace（qface 包），GIF 优先，无 GIF 时回退静态 PNG
 * - WeChat Emoji：QFace 仓库 public/assets/wechat_emoji 官方索引（PNG 资源）
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
  // md-editor-v3 注入的通用工具栏属性，声明以拦截透传
  language?: string
  theme?: string
  previewTheme?: string
  codeTheme?: string
}>(), {
  title: '表情',
  selectAfterInsert: true
})

const visible = ref(false)
const activeTab = ref<EmojiTab>('qqnt')
const emojis = ref<string[]>([])
const emojiPacks = ref<EmojiPackItem[]>([])
// 图片加载失败后回退到备用地址（QQNT：GIF -> 静态 PNG）
const failedIds = ref<Set<string>>(new Set())

const qqntEmojis = computed<QFaceEmojiItem[]>(() =>
    (qfaceData as Face[])
        .filter((item) => item.QHide !== '1')
        .map((item) => {
          const id = String(item.QSid)
          const officialUrl = getUrl(id, QFACE_BASE)
          return {
            id,
            name: item.QDes.replace(/^\//, '') || `#${id}`,
            // qface 官方 URL 规则：动态图 /gif/s{id}.gif，静态图 /static/s{id}.png
            // 有 GIF 时强制优先 GIF（个别 qface 标记为静态但仓库实际提供 GIF 的表情也能覆盖）
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
        // 去掉 Markdown 图片 alt 中的方括号，避免破坏图片语法
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

function insertQFaceEmoji(item: QFaceEmojiItem) {
  insertEmojiImage(item.name, emojiUrl(item))
}

function insertEmojiImage(name: string, url: string) {
  // 使用标准 Markdown 图片语法嵌入，并通过属性语法限制展示尺寸
  insertContent(`![${name}](${url}){width=100}`)
}

function insertEmojiPack(item: EmojiPackItem) {
  insertEmojiImage(item.name || '表情包', item.url)
}

async function loadEmojis() {
  try {
    const res: any = await api.get('/emojis')
    emojis.value = res.data?.emojis || []
  } catch {
    emojis.value = []
  }
}

async function loadEmojiPacks() {
  try {
    const res: any = await api.get('/emoji-packs')
    emojiPacks.value = res.data?.list || []
  } catch {
    emojiPacks.value = []
  }
}

function handleVisibleChange(value: boolean) {
  visible.value = value
}

onMounted(() => {
  loadEmojis()
  loadEmojiPacks()
})
// 编辑器页面可能被 keep-alive 缓存，重新激活时刷新最新表情
onActivated(() => {
  loadEmojis()
  loadEmojiPacks()
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
      <Smile class="md-editor-icon"/>
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
            <li v-if="!emojiPacks.length" class="qface-emoji-empty">暂无表情包，请到表情管理中新增</li>
          </ul>
        </div>

        <div class="qface-emoji-panel__tabs" role="tablist">
          <button
              type="button"
              :class="{active: activeTab === 'custom'}"
              role="tab"
              :aria-selected="activeTab === 'custom'"
              @click="activeTab = 'custom'"
          >
            emoji
          </button>
          <button
              type="button"
              :class="{active: activeTab === 'qqnt'}"
              role="tab"
              :aria-selected="activeTab === 'qqnt'"
              @click="activeTab = 'qqnt'"
          >
            QQNT 表情库
          </button>
          <button
              type="button"
              :class="{active: activeTab === 'wechat'}"
              role="tab"
              :aria-selected="activeTab === 'wechat'"
              @click="activeTab = 'wechat'"
          >
            WeChat Emoji
          </button>
          <button
              type="button"
              :class="{active: activeTab === 'pack'}"
              role="tab"
              :aria-selected="activeTab === 'pack'"
              @click="activeTab = 'pack'"
          >
            表情包
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
</style>
