const juejinPlatform = require('./juejin');
const zhihuPlatform = require('./zhihu');
const csdnPlatform = require('./csdn');
const rssPlatform = require('./rss');

/**
 * 文章平台注册表
 * 新增平台只需在 articlePlatforms/ 下新建适配器并在本文件注册，无需改动调用方
 */
const REGISTRY = {
  juejin: juejinPlatform,
  zhihu: zhihuPlatform,
  csdn: csdnPlatform,
  rss: rssPlatform
};

/**
 * 获取平台适配器
 * @param {string} platformId - 平台 ID
 */
function getPlatform(platformId) {
  if (!platformId || !REGISTRY[platformId]) {
    const err = new Error(`不支持的平台：${platformId}`);
    err.code = 'INVALID_PLATFORM';
    throw err;
  }
  return REGISTRY[platformId];
}

/**
 * 列出所有可用平台
 * @returns {Array<{id: string, label: string, type: 'article'}>}
 */
function listPlatforms() {
  return Object.values(REGISTRY).map(p => ({
    id: p.id,
    label: p.label,
    type: p.type
  }));
}

module.exports = {
  REGISTRY,
  getPlatform,
  listPlatforms
};
