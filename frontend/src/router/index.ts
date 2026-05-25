import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
    meta: { title: 'LinzyBlog' },
  },
  {
    path: '/article/:id',
    name: 'Article',
    component: () => import('@/pages/Article.vue'),
    meta: { title: '文章详情' },
  },
  {
    path: '/category/:id/:name',
    name: 'Category',
    component: () => import('@/pages/Category.vue'),
    meta: { title: '分类' },
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('@/pages/Categories.vue'),
    meta: { title: '全部分类' },
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('@/pages/Tags.vue'),
    meta: { title: '全部标签' },
  },
  {
    path: '/tag/:id/:name',
    name: 'Tag',
    component: () => import('@/pages/Tag.vue'),
    meta: { title: '标签' },
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('@/pages/Archive.vue'),
    meta: { title: '归档' },
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/pages/Search.vue'),
    meta: { title: '搜索' },
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/pages/About.vue'),
    meta: { title: '关于' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFound.vue'),
    meta: { title: '404 - 页面未找到' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const title = (to.meta.title as string) || 'LinzyBlog'
  document.title = title
})

export default router