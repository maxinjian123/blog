// P4-3: RSS 2.0 订阅源
const express = require('express');
const { Article, User, Category } = require('../models');

const router = express.Router();

function escapeXml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripMarkdown(md) {
  if (!md) return '';
  return String(md)
    .replace(/```[\s\S]*?```/g, '')   // 代码块
    .replace(/`([^`]+)`/g, '$1')       // 行内代码
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // 图片
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
    .replace(/^#{1,6}\s+/gm, '')        // 标题
    .replace(/^\s*[-*+]\s+/gm, '')      // 列表
    .replace(/^\s*>\s+/gm, '')          // 引用
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // 粗体
    .replace(/\*([^*]+)\*/g, '$1')      // 斜体
    .replace(/~~([^~]+)~~/g, '$1')      // 删除线
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

router.get('/', async (req, res, next) => {
  try {
    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const siteName = 'LinzyBlog';
    const siteDesc = '记录技术学习与思考的个人博客';

    const articles = await Article.findAll({
      where: { status: 'published' },
      include: [
        { model: User, as: 'author', attributes: ['username', 'nickname'] },
        { model: Category, as: 'category', attributes: ['name'] }
      ],
      order: [['published_at', 'DESC'], ['created_at', 'DESC']],
      limit: 20,
      attributes: ['id', 'title', 'slug', 'content', 'summary', 'published_at', 'created_at', 'content_type']
    });

    const items = articles.map(a => {
      const link = `${siteUrl}/article/${a.id}`;
      const pubDate = (a.published_at || a.created_at).toUTCString();
      const description = a.summary || stripMarkdown(a.content).slice(0, 200);
      // RSS 内容使用纯文本描述，避免嵌入完整 markdown
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(a.category?.name || '')}</category>
      <author>${escapeXml(a.author?.nickname || a.author?.username || 'Linzy')}</author>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    }).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <atom:link href="${escapeXml(siteUrl + '/api/v1/rss')}" rel="self" type="application/rss+xml"/>
    <description>${escapeXml(siteDesc)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>TechMind Blog RSS Generator</generator>
${items}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=600');
    return res.send(rss);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
