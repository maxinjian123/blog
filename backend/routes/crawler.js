const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { Article, Tag } = require('../models');
const crawler = require('../services/githubCrawler');
const ai = require('../services/ai');
const { extractCatalog, extractTitleFromMarkdown, stripMarkdown, generateUniqueSlug } = require('../utils/markdown');

const router = express.Router();

/**
 * @swagger
 * /crawler/search:
 *   get:
 *     summary: 按关键词搜索 GitHub 仓库
 *     tags: [爬虫]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         description: 搜索关键词
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: language
 *         schema: { type: string }
 *         description: 按编程语言过滤（如 markdown、javascript）
 *     responses:
 *       200:
 *         description: 搜索结果
 */
router.get('/search', auth, adminOnly, async (req, res, next) => {
  try {
    const { keyword, page = 1, pageSize = 20, language } = req.query;
    if (!keyword || !keyword.trim()) {
      return error(res, '请输入搜索关键词', 400);
    }
    const result = await crawler.searchRepositories(keyword, {
      page: Number(page),
      pageSize: Number(pageSize),
      language: language || undefined
    });
    const msg = result.limitReached
      ? `已到达 GitHub 搜索结果上限（前 1000 条），请更换关键词缩小范围`
      : `共找到 ${result.total} 个仓库`;
    return success(res, result, msg);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /crawler/search-code:
 *   get:
 *     summary: 按关键词搜索 Markdown 文章内容（直接命中包含关键词的 .md 文件）
 *     tags: [爬虫]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema: { type: string }
 *         description: 搜索关键词（在 .md 文件内容中匹配）
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: repo
 *         schema: { type: string }
 *         description: 限定仓库（格式 owner/repo），不传则全站搜索
 *       - in: query
 *         name: user
 *         schema: { type: string }
 *         description: 限定用户/组织，不传则全站搜索
 *     responses:
 *       200:
 *         description: 搜索结果（直接返回文件列表）
 */
router.get('/search-code', auth, adminOnly, async (req, res, next) => {
  try {
    const { keyword, page = 1, pageSize = 20, repo, user } = req.query;
    if (!keyword || !keyword.trim()) {
      return error(res, '请输入搜索关键词', 400);
    }
    const result = await crawler.searchCode(keyword, {
      page: Number(page),
      pageSize: Number(pageSize),
      repo: repo || undefined,
      user: user || undefined
    });
    const msg = result.limitReached
      ? `已到达 GitHub 搜索结果上限（前 1000 条），请更换关键词缩小范围`
      : `共找到 ${result.total} 篇文章`;
    return success(res, result, msg);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /crawler/repos/{owner}/{repo}/files:
 *   get:
 *     summary: 列出仓库中所有 Markdown 文件
 *     tags: [爬虫]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: owner
 *         required: true
 *         description: 仓库所有者/组织
 *         schema: { type: string }
 *       - in: path
 *         name: repo
 *         required: true
 *         description: 仓库名
 *         schema: { type: string }
 *       - in: query
 *         name: ref
 *         schema: { type: string }
 *         description: 分支/Tag，不传则使用默认分支
 *     responses:
 *       200:
 *         description: 文件列表
 */
router.get('/repos/:owner/:repo/files', auth, adminOnly, async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const { ref } = req.query;
    const result = await crawler.listMarkdownFiles(owner, repo, ref);
    return success(res, result, `共 ${result.files.length} 个 Markdown 文件`);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /crawler/preview:
 *   post:
 *     summary: 预览 GitHub 文件内容
 *     tags: [爬虫]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               owner: { type: string, description: 仓库所有者/组织（必填） }
 *               repo: { type: string, description: 仓库名（必填） }
 *               path: { type: string, description: 文件路径（必填） }
 *               ref: { type: string, description: 分支/Tag，不传用默认分支 }
 *     responses:
 *       200:
 *         description: 文件内容
 */
router.post('/preview', auth, adminOnly, async (req, res, next) => {
  try {
    const { owner, repo, path: filePath, ref } = req.body;
    if (!owner || !repo || !filePath) {
      return error(res, '参数缺失', 400);
    }
    const file = await crawler.fetchFileContent(owner, repo, filePath, ref);
    // 预览时截断过长内容
    const previewContent = file.content.length > 8000
      ? file.content.slice(0, 8000) + '\n\n<!-- 内容已截断，完整内容请导入后查看 -->'
      : file.content;
    return success(res, {
      name: file.name,
      path: file.path,
      size: file.size,
      content: previewContent,
      truncated: file.content.length > 8000,
      html_url: file.html_url
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /crawler/import:
 *   post:
 *     summary: 将 GitHub 文件导入为博客草稿（支持自动生成摘要和标签）
 *     tags: [爬虫]
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
 *                 description: 要导入的文件列表（最多 20 个）
 *                 items:
 *                   type: object
 *                   properties:
 *                     owner: { type: string, description: 仓库所有者/组织 }
 *                     repo: { type: string, description: 仓库名 }
 *                     path: { type: string, description: 文件路径 }
 *                     ref: { type: string, description: 分支/Tag }
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
      return error(res, '请提供要导入的文件列表', 400);
    }
    if (items.length > 20) {
      return error(res, '单次最多导入 20 篇文章', 400);
    }

    const results = [];
    const failed = [];

    for (const item of items) {
      try {
        const { owner, repo, path: filePath, ref } = item;
        if (!owner || !repo || !filePath) {
          failed.push({ path: filePath, reason: '参数缺失' });
          continue;
        }

        // 1. 拉取文件内容
        const file = await crawler.fetchFileContent(owner, repo, filePath, ref);
        if (!file.content || file.content.trim().length < 50) {
          failed.push({ path: filePath, reason: '内容过短或为空' });
          continue;
        }

        // 2. 提取标题
        let title = extractTitleFromMarkdown(file.content) ||
          file.name.replace(/\.(md|markdown|mdx)$/i, '');

        // 3. 生成 slug
        const slug = await generateUniqueSlug(title, 'github');

        // 4. 自动生成摘要
        let summary = '';
        if (autoSummary) {
          try {
            const plainText = stripMarkdown(file.content).slice(0, 3000);
            summary = await ai.summary.summarize(plainText, { maxLength: 200 });
          } catch (err) {
            console.warn('[Crawler] AI 摘要生成失败:', err.message);
            summary = stripMarkdown(file.content).slice(0, 200);
          }
        }

        // 5. 自动生成标签
        let tagNames = [];
        if (autoTags) {
          try {
            const fullContent = `标题：${title}\n\n内容：${stripMarkdown(file.content).slice(0, 3000)}`;
            tagNames = await ai.tag.generateTags(fullContent, { maxTags: 5 });
          } catch (err) {
            console.warn('[Crawler] AI 标签生成失败:', err.message);
          }
        }

        // 6. 创建文章（草稿状态）
        const article = await Article.create({
          title: title.slice(0, 200),
          slug,
          content: file.content,
          content_type: 'markdown',
          summary,
          status: 'draft',
          author_id: req.user.id,
          category_id: category_id || null,
          is_ai_generated: true,
          catalog: extractCatalog(file.content)
        });

        // 7. 关联标签
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
          await article.setTags(tagInstances);
        }

        results.push({
          id: article.id,
          title: article.title,
          slug: article.slug,
          path: filePath,
          summary: summary.slice(0, 80) + (summary.length > 80 ? '...' : ''),
          tags: tagNames
        });
      } catch (err) {
        console.error('[Crawler] 导入失败:', item.path, err.message);
        failed.push({ path: item.path, reason: err.message });
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
