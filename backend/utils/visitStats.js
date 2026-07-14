/**
 * 解析访客来源
 * @param {string} referer - HTTP Referer 头
 * @returns {string} - 来源分类: search/social/direct/other
 */
function parseSource(referer) {
  if (!referer) return 'direct';
  
  const refererLower = referer.toLowerCase();
  
  // 搜索引擎
  const searchEngines = ['google.com', 'baidu.com', 'bing.com', 'yahoo.com', 'sogou.com', 'so.com', 'yandex.com'];
  for (const engine of searchEngines) {
    if (refererLower.includes(engine)) return 'search';
  }
  
  // 社交媒体
  const socialSites = ['weibo.com', 'qq.com', 'wechat.com', 'twitter.com', 'facebook.com', 'linkedin.com', 'zhihu.com', 'douban.com'];
  for (const site of socialSites) {
    if (refererLower.includes(site)) return 'social';
  }
  
  return 'other';
}

/**
 * 解析设备类型
 * @param {string} userAgent - HTTP User-Agent 头
 * @returns {string} - 设备类型: mobile/tablet/pc
 */
function parseDevice(userAgent) {
  if (!userAgent) return 'pc';
  
  const uaLower = userAgent.toLowerCase();
  
  // 移动设备检测
  const mobileKeywords = ['mobile', 'android', 'iphone', 'ipod', 'windows phone'];
  for (const keyword of mobileKeywords) {
    if (uaLower.includes(keyword)) return 'mobile';
  }
  
  // 平板设备检测
  const tabletKeywords = ['ipad', 'tablet', 'playbook'];
  for (const keyword of tabletKeywords) {
    if (uaLower.includes(keyword)) return 'tablet';
  }
  
  return 'pc';
}

/**
 * 记录访客统计信息到 Redis
 * @param {object} options - 选项
 * @param {string} options.referer - HTTP Referer
 * @param {string} options.userAgent - HTTP User-Agent
 * @param {object} options.redis - Redis 客户端实例
 */
async function recordVisitStats({ referer, userAgent, redis }) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const source = parseSource(referer);
    const device = parseDevice(userAgent);
    
    // 记录来源统计
    const sourceKey = `visit_source:${today}:${source}`;
    await redis.incr(sourceKey);
    await redis.expire(sourceKey, 86400 * 30); // 30天过期
    
    // 记录设备统计
    const deviceKey = `visit_device:${today}:${device}`;
    await redis.incr(deviceKey);
    await redis.expire(deviceKey, 86400 * 30); // 30天过期
    
    // 记录小时分布（24小时）
    const hour = new Date().getHours();
    const hourKey = `visit_hour:${today}:${hour}`;
    await redis.incr(hourKey);
    await redis.expire(hourKey, 86400 * 7); // 7天过期
  } catch (err) {
    console.error('记录访客统计失败:', err);
  }
}

module.exports = {
  parseSource,
  parseDevice,
  recordVisitStats
};
