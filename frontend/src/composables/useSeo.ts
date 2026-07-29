import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead, useSeoMeta } from '@unhead/vue'
import { useSiteStore } from '@/stores/site'

export function useArticleSeo(article: any) {
  const route = useRoute()
  const siteStore = useSiteStore()
  const siteName = computed(() => siteStore.info.site_name || 'Blog')

  const title = computed(() => article.value?.title || '文章详情')
  const description = computed(() => article.value?.summary || `${siteName.value} - 技术博客`)
  const keywords = computed(() => {
    if (article.value?.tags && Array.isArray(article.value.tags)) {
      return article.value.tags
        .map((tag: any) => (typeof tag === 'string' ? tag : tag.name))
        .join(', ')
    }
    return `${siteName.value}, Blog, Vue, 前端, 技术`
  })
  const canonical = computed(() => `${window.location.origin}${route.fullPath}`)

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: 'article',
    ogUrl: canonical,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
  })

  useHead({
    meta: () => [
      { name: 'keywords', content: keywords.value },
      { name: 'robots', content: 'index, follow' },
    ],
    link: () => [{ rel: 'canonical', href: canonical.value }],
  })

  return { title, description, keywords, canonical }
}

export function usePageSeo(meta: {
  title: string
  description?: string | (() => string)
  keywords?: string | (() => string)
}) {
  const route = useRoute()
  const siteStore = useSiteStore()
  const siteName = computed(() => siteStore.info.site_name || 'Blog')

  const resolveDesc = () => {
    const d = typeof meta.description === 'function' ? meta.description() : meta.description
    return d || `${siteName.value} - 个人技术博客`
  }
  const resolveKeywords = () => {
    const k = typeof meta.keywords === 'function' ? meta.keywords() : meta.keywords
    return k || `${siteName.value}, Blog, Vue, 前端, 技术`
  }

  const canonical = computed(() => `${window.location.origin}${route.fullPath}`)

  useSeoMeta({
    title: meta.title,
    description: () => resolveDesc(),
    ogTitle: meta.title,
    ogDescription: () => resolveDesc(),
    ogType: 'website',
    ogUrl: canonical,
    twitterCard: 'summary_large_image',
    twitterTitle: meta.title,
    twitterDescription: () => resolveDesc(),
  })

  useHead({
    meta: () => [
      { name: 'keywords', content: resolveKeywords() },
      { name: 'robots', content: 'index, follow' },
    ],
    link: () => [{ rel: 'canonical', href: canonical.value }],
  })

  return { canonical }
}
