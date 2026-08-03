<script setup lang="ts">
import {computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useTabsStore} from '@/stores/tabs'
import type {TabItem} from '@/stores/tabs'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

const activeKey = computed(() => route.fullPath)

function handleChange(key: string | number) {
    router.push(String(key))
}

function handleEdit(targetKey: string | number | MouseEvent, action: 'add' | 'remove') {
    if (action === 'remove' && typeof targetKey === 'string') {
        handleClose(targetKey)
    }
}

function handleClose(fullPath: string) {
    const tab = tabsStore.visitedTabs.find((item) => item.fullPath === fullPath)
    if (!tab || tab.affix) return
    const next = tabsStore.removeTab(fullPath)
    if (route.fullPath === fullPath && next) {
        router.push(next)
    }
}

async function handleRefresh(fullPath: string) {
    if (route.fullPath !== fullPath) {
        await router.push(fullPath)
    }
    await tabsStore.refreshTab(route)
}

function handleMenuClick({key}: { key: string | number }, tab: TabItem) {
    const action = String(key)
    switch (action) {
        case 'refresh':
            handleRefresh(tab.fullPath)
            break
        case 'close':
            handleClose(tab.fullPath)
            break
        case 'close-others':
            tabsStore.closeOthers(tab.fullPath)
            if (route.fullPath !== tab.fullPath) router.push(tab.fullPath)
            break
        case 'close-all': {
            const shouldGoHome = route.path !== '/'
            tabsStore.closeAll()
            if (shouldGoHome) router.push('/')
            break
        }
    }
}
</script>

<template>
    <div class="tabs-nav">
        <a-tabs
            type="editable-card"
            hide-add
            size="small"
            :active-key="activeKey"
            :tab-bar-style="{ margin: 0 }"
            @change="handleChange"
            @edit="handleEdit"
        >
            <a-tab-pane
                v-for="tab in tabsStore.visitedTabs"
                :key="tab.fullPath"
                :closable="!tab.affix"
            >
                <template #tab>
                    <a-dropdown trigger="contextmenu" placement="bottomLeft">
                        <span class="tab-label">{{ tab.title }}</span>
                        <template #overlay>
                            <a-menu @click="handleMenuClick($event, tab)">
                                <a-menu-item key="refresh">刷新</a-menu-item>
                                <a-menu-item key="close" :disabled="tab.affix">关闭当前</a-menu-item>
                                <a-menu-divider/>
                                <a-menu-item key="close-others">关闭其他</a-menu-item>
                                <a-menu-item key="close-all">关闭全部</a-menu-item>
                            </a-menu>
                        </template>
                    </a-dropdown>
                </template>
            </a-tab-pane>
        </a-tabs>
    </div>
</template>

<style scoped>
.tabs-nav {
    flex: none;
    background: var(--color-bg-container);
    padding: 6px 16px 0;
    border-bottom: 1px solid var(--color-border);
}

.tabs-nav :deep(.ant-tabs-nav) {
    margin: 0;
}

.tabs-nav :deep(.ant-tabs-nav::before) {
    border-bottom: none;
}

.tabs-nav :deep(.ant-tabs-content-holder) {
    display: none;
}

.tabs-nav :deep(.ant-tabs-tab) {
    background: transparent !important;
    border-color: transparent !important;
}

.tabs-nav :deep(.ant-tabs-tab-active) {
    background: var(--color-bg-layout) !important;
    border-color: var(--color-border) !important;
}

.tabs-nav :deep(.ant-tabs-tab-active .tab-label) {
    color: var(--color-primary);
}

.tab-label {
    display: inline-block;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
    color: var(--color-text-secondary);
}
</style>
