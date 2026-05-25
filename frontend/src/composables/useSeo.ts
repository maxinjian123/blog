import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead, useSeoMeta } from '@unhead/vue'

export function useArticleSeo(article: any) {
  const route = useRoute()

  const title = computed(() => article.value?.title || '文章详情')
  const description = computed(() => article.value?.summary || 'TechMind Blog - 技术博客')
  const keywords = computed(() => {
    if (article.value?.tags && Array.isArray(article.value.tags)) {
      return article.value.tags
        .map((tag: any) => (typeof tag === 'string' ? tag : tag.name))
        .join(', ')
    }
    return 'TechMind, Blog, Vue, 前端, 技术'
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
  description?: string
  keywords?: string
}) {
  const route = useRoute()
  const canonical = computed(() => `${window.location.origin}${route.fullPath}`)

  useSeoMeta({
    title: meta.title,
    description: meta.description || 'TechMind Blog - 个人技术博客',
    ogTitle: meta.title,
    ogDescription: meta.description || 'TechMind Blog - 个人技术博客',
    ogType: 'website',
    ogUrl: canonical,
    twitterCard: 'summary_large_image',
    twitterTitle: meta.title,
    twitterDescription: meta.description || 'TechMind Blog - 个人技术博客',
  })

  useHead({
    meta: () => [
      { name: 'keywords', content: meta.keywords || 'TechMind, Blog, Vue, 前端, 技术' },
      { name: 'robots', content: 'index, follow' },
    ],
    link: () => [{ rel: 'canonical', href: canonical.value }],
  })

  return { canonical }
}
