const { getPlatform, listPlatforms } = require('./articlePlatforms');

/**
 * 文章抓取门面（Facade）
 * 对外提供统一接口，内部按平台 ID 分发到具体适配器
 * 新增平台只需在 articlePlatforms/ 下实现适配器并在 index.js 注册
 */

/**
 * 列出所有可用平台
 * @returns {Array<{id: string, label: string, type: 'article'}>}
 */
function listAllPlatforms() {
  return listPlatforms();
}

/**
 * 按关键词搜索文章
 * @param {string} keyword
 * @param {number} page
 * @param {number} pageSize
 * @param {string} platformId - juejin / zhihu / csdn / rss
 * @param {object} extra - 平台附加参数（如 rss 平台的 { rss_url }）
 */
async function searchArticles(keyword, page = 1, pageSize = 20, platformId, extra = {}) {
  const platform = getPlatform(platformId);
  return platform.search(keyword, page, pageSize, extra);
}

/**
 * 拉取文章正文（返回结构化内容，含 Markdown 或 HTML）
 * @param {object} item - search 返回的列表项
 * @param {string} platformId
 * @param {object} extra - 平台附加参数（如 rss 平台的 { rss_url }）
 * @returns {Promise<{title: string, content_html: string, content_md: string, author: string, source_url: string, source_platform: string, publish_time: number, cover: string}>}
 */
async function fetchArticle(item, platformId, extra = {}) {
  const platform = getPlatform(platformId);
  return platform.fetchArticle(item, extra);
}

module.exports = {
  listAllPlatforms,
  searchArticles,
  fetchArticle
};
