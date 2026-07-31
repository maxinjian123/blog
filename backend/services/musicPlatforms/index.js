const neteasePlatform = require('./netease');
const qqPlatform = require('./qq');

/**
 * 平台注册表
 * 新增平台只需在此注册，无需改动调用方
 */
const REGISTRY = {
  netease: neteasePlatform,
  qq: qqPlatform
};

const DEFAULT_PLATFORM = 'netease';

/**
 * 获取平台适配器
 * @param {string} [platformId] - 平台 ID，未提供则使用默认平台
 * @returns {object} 平台适配器实例
 */
function getPlatform(platformId) {
  const id = platformId && REGISTRY[platformId] ? platformId : DEFAULT_PLATFORM;
  return REGISTRY[id];
}

/**
 * 列出所有可用平台（用于前端选择）
 * @returns {Array<{id: string, label: string}>}
 */
function listPlatforms() {
  return Object.values(REGISTRY).map(p => ({id: p.id, label: p.label}));
}

module.exports = {
  REGISTRY,
  DEFAULT_PLATFORM,
  getPlatform,
  listPlatforms
};
