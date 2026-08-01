import type {RouteRecordRaw} from 'vue-router'
import {createRouter, createWebHistory} from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/pages/Login.vue'),
        meta: {title: '登录'}
    },
    {
        path: '/',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard.vue'),
        meta: {title: '仪表盘', requiresAuth: true}
    },
    {
        path: '/articles',
        name: 'ArticleList',
        component: () => import('@/pages/ArticleList.vue'),
        meta: {title: '文章管理', requiresAuth: true}
    },
    {
        path: '/articles/create',
        name: 'ArticleCreate',
        component: () => import('@/pages/ArticleEditor.vue'),
        meta: {title: '创建文章', requiresAuth: true}
    },
    {
        path: '/articles/:id/edit',
        name: 'ArticleEdit',
        component: () => import('@/pages/ArticleEditor.vue'),
        meta: {title: '编辑文章', requiresAuth: true}
    },
    {
        path: '/categories',
        name: 'CategoryManage',
        component: () => import('@/pages/CategoryManage.vue'),
        meta: {title: '分类管理', requiresAuth: true}
    },
    {
        path: '/tags',
        name: 'TagManage',
        component: () => import('@/pages/TagManage.vue'),
        meta: {title: '标签管理', requiresAuth: true}
    },
    {
        path: '/comments',
        name: 'CommentManage',
        component: () => import('@/pages/CommentManage.vue'),
        meta: {title: '评论管理', requiresAuth: true}
    },
    {
        path: '/guestbook',
        name: 'GuestbookManage',
        component: () => import('@/pages/GuestbookManage.vue'),
        meta: {title: '留言管理', requiresAuth: true}
    },
    {
        path: '/subscribers',
        name: 'SubscriberManage',
        component: () => import('@/pages/SubscriberManage.vue'),
        meta: {title: '邮件订阅', requiresAuth: true}
    },
    {
        path: '/operation-logs',
        name: 'OperationLogs',
        component: () => import('@/pages/OperationLogs.vue'),
        meta: {title: '操作日志', requiresAuth: true}
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/pages/Settings.vue'),
        meta: {title: '系统设置', requiresAuth: true}
    },
    {
        path: '/announcements',
        name: 'AnnouncementManage',
        component: () => import('@/pages/AnnouncementManage.vue'),
        meta: {title: '公告管理', requiresAuth: true}
    },
    {
        path: '/links',
        name: 'LinkManage',
        component: () => import('@/pages/LinkManage.vue'),
        meta: {title: '友链管理', requiresAuth: true}
    },
    {
        path: '/media',
        name: 'MediaLibrary',
        component: () => import('@/pages/MediaLibrary.vue'),
        meta: {title: '媒体库', requiresAuth: true}
    },
    {
        path: '/profile',
        name: 'AdminProfile',
        component: () => import('@/pages/AdminProfile.vue'),
        meta: {title: '个人信息', requiresAuth: true}
    },
    {
        path: '/',
        name: 'Crawler',
        meta: {title: '数据抓取', requiresAuth: true},
        children: [
            {
                path: '/crawler',
                name: 'GitHubCrawler',
                component: () => import('@/pages/GitHubCrawler.vue'),
                meta: {title: 'GitHub抓取', requiresAuth: true}
            },
            {
                path: '/music',
                name: 'MusicCrawler',
                component: () => import('@/pages/MusicCrawler.vue'),
                meta: {title: '音乐抓取', requiresAuth: true}
            },
            {
                path: '/image-crawler',
                name: 'ImageCrawler',
                component: () => import('@/pages/ImageCrawler.vue'),
                meta: {title: '图片抓取', requiresAuth: true}
            }
        ]
    },

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, _from, next) => {
    const token = localStorage.getItem('admin_token')

    if (to.meta.requiresAuth && !token) {
        next('/login')
    } else if (to.path === '/login' && token) {
        next('/')
    } else {
        next()
    }
})

router.afterEach((to) => {
    document.title = `${to.meta.title || '3D Blog'} - 管理后台`
})

export default router