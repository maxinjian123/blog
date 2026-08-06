const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { Article, Tag } = require('../models');
const articleCrawler = require('../services/articleCrawler');
const ai = require('../services/ai');
const { extractCatalog, extractTitleFromMarkdown, stripMarkdown, generateUniqueSlug } = require('../utils/markdown');
const { cleanHtmlToMarkdown } = require('../utils/articleHtml');

const router = express.Router();

/**
 * 单次批量导入上限
 */
const MAX_BATCH = 20;

/**
 * 各平台的版权 / 许可说明（写入 Article.source_license，便于后续追溯）
 */
const PLATFORM_LICENSES = {
  juejin: '掘金社区文章，版权归原作者所有，转载需注明出处与原文链接',
  zhihu: '知乎内容，版权归原作者所有，转载需注明出处与原文链接',
  csdn: 'CSDN 博客文章，版权归原作者所有，转载需注明出处与原文链接',
  rss: 'RSS 订阅源文章，版权归原作者所有，转载需注明出处与原文链接'
};

function getPlatformLicense(platform) {
  return PLATFORM_LICENSES[platform] || `${platform} 来源文章，版权归原作者所有`;
}

/**
 * 统一包装平台相关错误：INVALID_PLATFORM 转 400
 */
function handlePlatformError(err, res) {
  if (err.code === 'INVALID_PLATFORM') {
    return error(res, err.message, 400);
  }
  return null;
}

/**
 * @swagger
 * /article-crawler/platforms:
 *   get:
 *     summary: 列出可用的文章抓取平台
 *     tags: [文章抓取]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 平台列表
 */
router.get('/platforms', auth, adminOnly, async (req, res, next) => {
  try {
    const list = articleCrawler.listAllPlatforms();
    return success(res, list);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /article-crawler/search:
 *   get:
 *     summary: 按关键词搜索文章
 *     tags: [文章抓取]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         description: 搜索关键词
 *         schema: { type: string }
 *       - in: query
 *         name: platform
 *         required: true
 *         description: 文章平台
 *         schema: { type: string, enum: [juejin, zhihu, csdn, rss] }
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: rss_url
 *         description: RSS 源地址（platform 为 rss 时必填）
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 搜索结果
 */
router.get('/search', auth, adminOnly, async (req, res, next) => {
  try {
    const { keyword, platform, page = 1, pageSize = 20, rss_url } = req.query;
    if (!keyword || !String(keyword).trim()) {
      return error(res, '请输入搜索关键词', 400);
    }
    if (!platform) {
      return error(res, '请选择平台', 400);
    }

    const result = await articleCrawler.searchArticles(
      String(keyword).trim(),
      Number(page),
      Number(pageSize),
      String(platform),
      { rss_url: String(rss_url || '') }
    );

    return success(res, result, `共找到 ${result.total} 个结果`);
  } catch (err) {
    const handled = handlePlatformError(err, res);
    if (handled) return handled;
    next(err);
  }
});

/**
 * @swagger
 * /article-crawler/preview:
 *   post:
 *     summary: 预览文章正文（拉取并转为 Markdown，截断显示）
 *     tags: [文章抓取]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform: { type: string, enum: [juejin, zhihu, csdn, rss], description: 文章平台（必填） }
 *               item:
 *                 type: object
 *                 description: search 接口返回的列表项（含 id/source_url 等）
 *               rss_url: { type: string, description: RSS 源地址（platform 为 rss 时必填） }
 *     responses:
 *       200:
 *         description: 预览内容
 */
router.post('/preview', auth, adminOnly, async (req, res, next) => {
  try {
    const { platform, item, rss_url } = req.body;
    if (!platform || !item) {
      return error(res, '参数缺失：platform 和 item 必填', 400);
    }

    const article = await articleCrawler.fetchArticle(item, platform, { rss_url: String(rss_url || '') });
    const markdown = article.content_md || cleanHtmlToMarkdown(article.content_html, article.source_url);

    // 预览时截断过长内容
    const previewContent = markdown.length > 8000
      ? markdown.slice(0, 8000) + '\n\n<!-- 内容已截断，完整内容请导入后查看 -->'
      : markdown;

    return success(res, {
      title: article.title,
      author: article.author,
      source_url: article.source_url,
      source_platform: article.source_platform,
      publish_time: article.publish_time || 0,
      cover: article.cover || '',
      content: previewContent,
      truncated: markdown.length > 8000
    });
  } catch (err) {
    // 抓取失败（网络/反爬等）对前端友好返回具体原因
    return error(res, err.message || '预览失败', 400);
  }
});

/**
 * @swagger
 * /article-crawler/import:
 *   post:
 *     summary: 将采集到的文章导入为博客草稿（支持自动生成摘要和标签）
 *     tags: [文章抓取]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 description: 要导入的文章列表（最多 20 个）
 *                 items:
 *                   type: object
 *                   properties:
 *                     platform: { type: string, enum: [juejin, zhihu, csdn, rss], description: 文章平台（必填） }
 *                     item:
 *                       type: object
 *                       description: search 接口返回的列表项
 *                     rss_url: { type: string, description: RSS 源地址（platform 为 rss 时必填） }
 *               autoSummary: { type: boolean, default: true, description: 是否 AI 自动生成摘要 }
 *               autoTags: { type: boolean, default: true, description: 是否 AI 自动生成标签 }
 *               category_id: { type: string, description: 导入文章的分类 ID }
 *     responses:
 *       200:
 *         description: 导入成功
 */
router.post('/import', auth, adminOnly, async (req, res, next) => {
  try {
    const { items, autoSummary = true, autoTags = true, category_id } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return error(res, '请提供要导入的文章列表', 400);
    }
    if (items.length > MAX_BATCH) {
      return error(res, `单次最多导入 ${MAX_BATCH} 篇文章`, 400);
    }

    const results = [];
    const failed = [];

    for (const entry of items) {
      const { platform, item, rss_url } = entry || {};
      try {
        if (!platform || !item) {
          failed.push({ title: item?.title || '', reason: '参数缺失：platform 和 item 必填' });
          continue;
        }

        // 1. 拉取文章内容
        const article = await articleCrawler.fetchArticle(item, platform, { rss_url: String(rss_url || '') });
        const markdown = (article.content_md || cleanHtmlToMarkdown(article.content_html, article.source_url)).trim();
        if (markdown.length < 50) {
          failed.push({ title: article.title || item.title, reason: '内容过短或为空' });
          continue;
        }

        // 2. 来源去重：同一原文链接只导入一次
        if (article.source_url) {
          const exists = await Article.findOne({ where: { source_url: article.source_url }, attributes: ['id'] });
          if (exists) {
            failed.push({ title: article.title || item.title, reason: '该文章已在博客中，已跳过' });
            continue;
          }
        }

        // 3. 提取标题
        const title = (article.title && article.title.trim())
          ? article.title.trim()
          : (extractTitleFromMarkdown(markdown) || '未命名');

        // 4. 生成 slug
        const slug = await generateUniqueSlug(title, 'collected');

        // 5. 自动生成摘要
        let summary = '';
        if (autoSummary) {
          try {
            const plainText = stripMarkdown(markdown).slice(0, 3000);
            summary = await ai.summary.summarize(plainText, { maxLength: 200 });
          } catch (err) {
            console.warn('[ArticleCrawler] AI 摘要生成失败:', err.message);
            summary = stripMarkdown(markdown).slice(0, 200);
          }
        }

        // 6. 自动生成标签
        let tagNames = [];
        if (autoTags) {
          try {
            const fullContent = `标题：${title}\n\n内容：${stripMarkdown(markdown).slice(0, 3000)}`;
            tagNames = await ai.tag.generateTags(fullContent, { maxTags: 5 });
          } catch (err) {
            console.warn('[ArticleCrawler] AI 标签生成失败:', err.message);
          }
        }

        // 7. 创建文章（草稿状态，Markdown 格式，记录来源溯源信息）
        const created = await Article.create({
          title: title.slice(0, 200),
          slug,
          content: markdown,
          content_type: 'markdown',
          summary,
          status: 'draft',
          author_id: req.user.id,
          category_id: category_id || null,
          catalog: extractCatalog(markdown),
          source_platform: article.source_platform || platform,
          source_author: article.author || '',
          source_url: article.source_url || '',
          source_license: getPlatformLicense(platform)
        });

        // 8. 关联标签
        if (tagNames && tagNames.length > 0) {
          const tagInstances = await Promise.all(
            tagNames.map(async (tagName) => {
              const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '') || tagName;
              const [tag] = await Tag.findOrCreate({
                where: { name: tagName },
                defaults: { name: tagName, slug: tagSlug }
              });
              return tag;
            })
          );
          await created.setTags(tagInstances);
        }

        results.push({
          id: created.id,
          title: created.title,
          slug: created.slug,
          summary: summary.slice(0, 80) + (summary.length > 80 ? '...' : ''),
          tags: tagNames,
          source_url: created.source_url
        });
      } catch (err) {
        console.error('[ArticleCrawler] 导入失败:', entry?.item?.title, err.message);
        failed.push({ title: entry?.item?.title || '', reason: err.message });
      }
    }

    // 导入后清除热门分类/标签缓存
    if (results.length > 0) {
      const redis = require('../utils/redis');
      if (redis.status === 'ready') {
        Promise.all([
          redis.keys('blog:hot:categories:*'),
          redis.keys('blog:hot:tags:*')
        ]).then(([catKeys, tagKeys]) => {
          const all = [...(catKeys || []), ...(tagKeys || [])];
          if (all.length) redis.del(...all);
        }).catch(() => {});
      }
    }

    return success(res, {
      imported: results.length,
      failed: failed.length,
      results,
      failed_list: failed
    }, `成功导入 ${results.length} 篇，失败 ${failed.length} 篇`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
