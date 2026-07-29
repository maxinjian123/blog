const express = require('express');
const { Article, Category, Tag } = require('../models');
const config = require('../config');

const router = express.Router();

// XML 转义
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 生成站点地图
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const baseUrl = config.site?.url || `${req.protocol}://${req.get('host')}`;

    // 获取所有已发布的文章
    const articles = await Article.findAll({
      attributes: ['id', 'title', 'updated_at'],
      where: { status: 'published' },
      order: [['updated_at', 'DESC']]
    });

    // 获取所有分类
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'slug']
    });

    // 获取所有标签
    const tags = await Tag.findAll({
      attributes: ['id', 'name', 'slug']
    });

    // 构建 XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 首页
    xml += '  <url>\n';
    xml += '    <loc>' + escapeXml(baseUrl) + '/</loc>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // 固定页面
    const staticPages = [
      { path: '/categories', priority: '0.8', changefreq: 'weekly' },
      { path: '/tags', priority: '0.8', changefreq: 'weekly' },
      { path: '/archive', priority: '0.7', changefreq: 'daily' },
      { path: '/links', priority: '0.6', changefreq: 'weekly' },
      { path: '/guestbook', priority: '0.7', changefreq: 'daily' },
      { path: '/search', priority: '0.5', changefreq: 'monthly' },
      { path: '/about', priority: '0.5', changefreq: 'monthly' },
      { path: '/rss', priority: '0.4', changefreq: 'hourly' }
    ];

    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += '    <loc>' + escapeXml(baseUrl) + page.path + '</loc>\n';
      xml += '    <changefreq>' + page.changefreq + '</changefreq>\n';
      xml += '    <priority>' + page.priority + '</priority>\n';
      xml += '  </url>\n';
    }

    // 文章页面
    for (const article of articles) {
      const lastmod = article.updated_at ? new Date(article.updated_at).toISOString().split('T')[0] : '';
      xml += '  <url>\n';
      xml += '    <loc>' + escapeXml(baseUrl) + '/article/' + article.id + '</loc>\n';
      if (lastmod) {
        xml += '    <lastmod>' + lastmod + '</lastmod>\n';
      }
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';
    }

    // 分类页面
    for (const category of categories) {
      xml += '  <url>\n';
      xml += '    <loc>' + escapeXml(baseUrl) + '/category/' + category.id + '/' + encodeURIComponent(category.slug || category.name) + '</loc>\n';
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    // 标签页面
    for (const tag of tags) {
      xml += '  <url>\n';
      xml += '    <loc>' + escapeXml(baseUrl) + '/tag/' + tag.id + '/' + encodeURIComponent(tag.slug || tag.name) + '</loc>\n';
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
