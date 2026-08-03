import {defineStore} from 'pinia'
import {nextTick, ref} from 'vue'
import type {RouteLocationNormalized} from 'vue-router'
import router from '@/router'

export interface TabItem {
    fullPath: string
    path: string
    title: string
    name: string
    affix?: boolean
}

const MAX_TABS = 20
const MAX_CACHED_VIEWS = 10
const STORAGE_KEY = 'admin_tabs'

function getCacheName(tab: Pick<TabItem, 'fullPath' | 'name'>): string {
    const resolved = router.resolve(tab.fullPath)
    return (resolved.meta.cacheName as string | undefined) || tab.name
}

export const useTabsStore = defineStore('tabs', () => {
    const visitedTabs = ref<TabItem[]>([])
    const cachedViews = ref<string[]>([])
    const reloadFlag = ref(false)

    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visitedTabs.value))
    }

    function rebuildCachedViews() {
        const names: string[] = []
        for (const tab of visitedTabs.value) {
            const cacheName = getCacheName(tab)
            const resolved = router.resolve(tab.fullPath)
            if (!cacheName || resolved.meta.noCache) continue
            if (!names.includes(cacheName)) names.push(cacheName)
        }
        cachedViews.value = names.slice(0, MAX_CACHED_VIEWS)
    }

    function restore() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (!saved) return
            const parsed: unknown = JSON.parse(saved)
            if (!Array.isArray(parsed)) return
            const valid = parsed.filter((item): item is TabItem => {
                if (!item || typeof item !== 'object') return false
                const tab = item as Partial<TabItem>
                if (typeof tab.fullPath !== 'string' || typeof tab.path !== 'string') return false
                if (tab.path === '/login') return false
                const resolved = router.resolve(tab.fullPath)
                return resolved.matched.length > 0 && !!resolved.meta.requiresAuth
            })
            visitedTabs.value = valid.map((tab) => ({
                fullPath: tab.fullPath,
                path: tab.path,
                title: tab.title || '未知页面',
                name: tab.name || '',
                affix: tab.path === '/'
            }))
            persist()
            rebuildCachedViews()
        } catch {
            visitedTabs.value = []
            cachedViews.value = []
        }
    }

    function addTab(route: RouteLocationNormalized) {
        if (route.path === '/login' || !route.meta.title || !route.meta.requiresAuth) return

        const title = String(route.meta.title)
        const name = (route.name as string) || route.path
        const existing = visitedTabs.value.find((tab) => tab.fullPath === route.fullPath)
        if (existing) {
            if (existing.title !== title) {
                existing.title = title
                persist()
            }
        } else {
            visitedTabs.value.push({
                fullPath: route.fullPath,
                path: route.path,
                title,
                name,
                affix: route.path === '/'
            })
            if (visitedTabs.value.length > MAX_TABS) {
                const index = visitedTabs.value.findIndex(
                    (tab) => !tab.affix && tab.fullPath !== route.fullPath
                )
                if (index !== -1) {
                    const [removed] = visitedTabs.value.splice(index, 1)
                    const cacheName = getCacheName(removed)
                    const stillUsed = visitedTabs.value.some(
                        (tab) => getCacheName(tab) === cacheName
                    )
                    if (!stillUsed) {
                        cachedViews.value = cachedViews.value.filter((n) => n !== cacheName)
                    }
                }
            }
            persist()
        }

        const cacheName = (route.meta.cacheName as string | undefined) || name
        if (!route.meta.noCache && cacheName && !cachedViews.value.includes(cacheName)) {
            cachedViews.value.push(cacheName)
            if (cachedViews.value.length > MAX_CACHED_VIEWS) {
                const index = cachedViews.value.findIndex((n) => n !== cacheName)
                if (index !== -1) cachedViews.value.splice(index, 1)
            }
        }
    }

    function removeTab(fullPath: string): string {
        const index = visitedTabs.value.findIndex((tab) => tab.fullPath === fullPath)
        if (index === -1) return ''
        const tab = visitedTabs.value[index]
        if (tab.affix) return ''

        visitedTabs.value.splice(index, 1)
        const cacheName = getCacheName(tab)
        const stillUsed = visitedTabs.value.some((item) => getCacheName(item) === cacheName)
        if (!stillUsed) {
            cachedViews.value = cachedViews.value.filter((n) => n !== cacheName)
        }
        persist()

        const next = visitedTabs.value[index] ?? visitedTabs.value[index - 1] ?? visitedTabs.value[0]
        return next?.fullPath ?? '/'
    }

    function closeOthers(fullPath: string) {
        visitedTabs.value = visitedTabs.value.filter(
            (tab) => tab.affix || tab.fullPath === fullPath
        )
        const remainingNames = new Set(visitedTabs.value.map((tab) => getCacheName(tab)))
        cachedViews.value = cachedViews.value.filter((n) => remainingNames.has(n))
        persist()
    }

    function closeAll() {
        visitedTabs.value = visitedTabs.value.filter((tab) => tab.affix)
        cachedViews.value = []
        persist()
    }

    async function refreshTab(route: RouteLocationNormalized) {
        const cacheName =
            (route.meta.cacheName as string | undefined) || (route.name as string) || ''
        const index = cachedViews.value.indexOf(cacheName)
        if (index !== -1) cachedViews.value.splice(index, 1)

        reloadFlag.value = true
        await nextTick()
        if (cacheName && !route.meta.noCache && !cachedViews.value.includes(cacheName)) {
            cachedViews.value.push(cacheName)
        }
        reloadFlag.value = false
    }

    function reset() {
        visitedTabs.value = []
        cachedViews.value = []
        reloadFlag.value = false
        localStorage.removeItem(STORAGE_KEY)
    }

    restore()

    return {
        visitedTabs,
        cachedViews,
        reloadFlag,
        addTab,
        removeTab,
        closeOthers,
        closeAll,
        refreshTab,
        reset
    }
})
