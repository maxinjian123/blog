const bingPlatform = require('./bing');
const baiduPlatform = require('./baidu');
const dogetuPlatform = require('./dogetu');
const pexelsPlatform = require('./pexels');
const pixabayPlatform = require('./pixabay');
const unsplashPlatform = require('./unsplash');

/**
 * 图片平台注册表
 * 新增平台只需在此注册，无需改动调用方
 */
const REGISTRY = {
  bing: bingPlatform,
  baidu: baiduPlatform,
  dogetu: dogetuPlatform,
  pexels: pexelsPlatform,
  pixabay: pixabayPlatform,
  unsplash: unsplashPlatform
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
 * @returns {Array<{id: string, label: string, type: 'image'|'meme'}>}
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
