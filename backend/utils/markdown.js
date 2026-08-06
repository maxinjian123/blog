/**
 * Markdown 工具函数集
 * 从 routes/crawler.js 抽取，供 GitHub 抓取与文章采集等模块共用
 */

/**
 * 从 markdown 内容提取目录（h1-h6），跳过代码块内的 #
 * @param {string} md
 * @returns {Array<{text: string, level: number}>}
 */
function extractCatalog(md) {
  if (!md || typeof md !== 'string') return [];
  const catalog = [];
  const lines = md.split('\n');
  let inCodeBlock = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (m) {
      const level = m[1].length;
      const text = m[2].replace(/[`*_~]/g, '').trim();
      if (text) catalog.push({ text, level });
    }
  }
  return catalog;
}

/**
 * 从 markdown 提取第一个一级标题作为文章标题
 * @param {string} md
 * @returns {string}
 */
function extractTitleFromMarkdown(md) {
  if (!md) return '';
  const lines = md.split('\n');
  let inCodeBlock = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    const m = line.match(/^#\s+(.+?)\s*#*\s*$/);
    if (m) return m[1].replace(/[`*_~]/g, '').trim();
  }
  return '';
}

/**
 * 去除 Markdown 标记，返回纯文本（用于 AI 摘要/标签生成）
 * @param {string} md
 * @returns {string}
 */
function stripMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/```[\s\S]*?```/g, '')   // 代码块
    .replace(/`[^`]+`/g, '')          // 行内代码
    .replace(/!\[.*?\]\(.*?\)/g, '')  // 图片
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // 链接保留文字
    .replace(/^#{1,6}\s+/gm, '')      // 标题标记
    .replace(/[*_~>|]/g, '')          // 强调/引用/表格标记
    .replace(/^-{3,}$/gm, '')         // 分割线
    .replace(/\n{3,}/g, '\n\n')       // 多空行压缩
    .trim();
}

/**
 * 根据标题生成唯一 slug（查重后追加数字后缀，最多 10 次）
 * @param {string} title
 * @param {string} fallbackPrefix - 无法从标题生成时的兜底前缀
 * @returns {Promise<string>}
 */
async function generateUniqueSlug(title, fallbackPrefix = 'article') {
  const { Article } = require('../models');
  let base = (title || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  if (!base) {
    base = `${fallbackPrefix}-${Date.now().toString(36)}`;
  }

  let slug = base;
  let suffix = 0;
  // 最多尝试 10 次追加数字后缀
  while (await Article.findOne({ where: { slug }, attributes: ['id'] })) {
    suffix++;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

module.exports = {
  extractCatalog,
  extractTitleFromMarkdown,
  stripMarkdown,
  generateUniqueSlug
};
