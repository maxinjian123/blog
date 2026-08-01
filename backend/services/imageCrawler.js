const { getPlatform, listPlatforms } = require('./imagePlatforms');

/**
 * 图片抓取门面（Facade）
 * 对外提供统一接口，内部按平台 ID 分发到具体适配器
 * 新增平台只需在 imagePlatforms/ 下实现适配器并在 index.js 注册
 */

/**
 * 列出所有可用平台
 * @returns {Array<{id: string, label: string, type: 'image'|'meme'}>}
 */
function listAllPlatforms() {
  return listPlatforms();
}

/**
 * 搜索图片/表情包
 * @param {string} keyword
 * @param {number} page
 * @param {number} pageSize
 * @param {string} platformId - bing / dogetu
 */
async function searchImages(keyword, page = 1, pageSize = 20, platformId) {
  const platform = getPlatform(platformId);
  return platform.search(keyword, page, pageSize);
}

/**
 * 下载原图（返回 Buffer）
 * @param {object} item - search 返回的列表项
 * @param {string} platformId
 * @returns {Promise<{buffer: Buffer, mimetype: string, filename: string}>}
 */
async function fetchOriginal(item, platformId) {
  const platform = getPlatform(platformId);
  return platform.fetchOriginal(item);
}

module.exports = {
  listAllPlatforms,
  searchImages,
  fetchOriginal
};
