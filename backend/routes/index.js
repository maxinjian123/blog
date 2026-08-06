const authRoutes = require('./auth');
const articleRoutes = require('./articles');
const commentRoutes = require('./comments');
const categoryRoutes = require('./categories');
const tagRoutes = require('./tags');
const uploadRoutes = require('./upload');
const aiRoutes = require('./ai');
const adminRoutes = require('./admin');
const announcementRoutes = require('./announcements');
const siteRoutes = require('./site');
const captchaRoutes = require('./captcha');
const commentUploadRoutes = require('./commentUpload');
const shareRoutes = require('./share');
const sitemapRoutes = require('./sitemap');
const linkRoutes = require('./links');
const rssRoutes = require('./rss');
const guestbookRoutes = require('./guestbook');
const subscriberRoutes = require('./subscribers');
const mediaRoutes = require('./media');
const crawlerRoutes = require('./crawler');
const imageCrawlerRoutes = require('./imageCrawler');
const articleCrawlerRoutes = require('./articleCrawler');
const musicRoutes = require('./music');
const playlistRoutes = require('./playlists');
const operationLogRoutes = require('./operationLogs');
const backupRoutes = require('./backups');
const emojiRoutes = require('./emojis');
const emojiPackRoutes = require('./emojiPacks');

// 加载 Swagger 文档声明（不注册为实际路由）
require('./swagger-docs');

/**
 * 路由配置列表
 * @type {Array<{path: string, router: import('express').Router, public?: boolean}>}
 */
const routes = [
    {path: '/api/v1/auth', router: authRoutes},
    {path: '/api/v1/articles', router: articleRoutes},
    {path: '/api/v1/comments', router: commentRoutes},
    {path: '/api/v1/categories', router: categoryRoutes},
    {path: '/api/v1/tags', router: tagRoutes},
    {path: '/api/v1/upload', router: uploadRoutes},
    {path: '/api/v1/comment-upload', router: commentUploadRoutes},
    {path: '/api/v1/ai', router: aiRoutes},
    {path: '/api/v1/admin', router: adminRoutes},
    {path: '/api/v1/announcements', router: announcementRoutes},
    {path: '/api/v1/site', router: siteRoutes},
    {path: '/api/v1/captcha', router: captchaRoutes},
    {path: '/api/v1/articles', router: shareRoutes},
    {path: '/api/v1/links', router: linkRoutes},
    {path: '/api/v1/rss', router: rssRoutes},
    {path: '/api/v1/guestbook', router: guestbookRoutes},
    {path: '/api/v1/subscribers', router: subscriberRoutes},
    {path: '/api/v1/media', router: mediaRoutes},
    {path: '/api/v1/crawler', router: crawlerRoutes},
    {path: '/api/v1/image-crawler', router: imageCrawlerRoutes},
    {path: '/api/v1/article-crawler', router: articleCrawlerRoutes},
    {path: '/api/v1/music', router: musicRoutes},
    {path: '/api/v1/playlists', router: playlistRoutes},
    {path: '/api/v1/operation-logs', router: operationLogRoutes},
    {path: '/api/v1/backups', router: backupRoutes},
    {path: '/api/v1/emojis', router: emojiRoutes},
    {path: '/api/v1/emoji-packs', router: emojiPackRoutes},
    {path: '/', router: sitemapRoutes}
];

/**
 * 统一注册路由到 Express 应用
 * @param {import('express').Application} app
 */
function registerRoutes(app) {
    for (const route of routes) {
        app.use(route.path, route.router);
    }
}

module.exports = {routes, registerRoutes};
