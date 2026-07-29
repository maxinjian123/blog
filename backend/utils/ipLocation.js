const axios = require('axios');
const redis = require('./redis');

const CACHE_PREFIX = 'ip_location:';
const CACHE_TTL = 86400 * 7; // 同一IP归属地缓存7天

// 内网/本地IP判断
function isPrivateIp(ip) {
  if (!ip) return true;
  const v4 = ip.replace(/^::ffff:/, '');
  return (
    v4 === '127.0.0.1' ||
    v4 === 'localhost' ||
    v4 === '::1' ||
    /^10\./.test(v4) ||
    /^192\.168\./.test(v4) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(v4) ||
    /^169\.254\./.test(v4)
  );
}

// 归一化省份名：去掉行政区划后缀，便于与地图名称做前缀匹配
function normalizeProvince(name) {
  if (!name) return '';
  return name
    .replace(/(维吾尔|壮族|回族)?自治区$/, '')
    .replace(/特别行政区$/, '')
    .replace(/[省市]$/, '');
}

/**
 * 解析 IP 归属地（ip-api.com 免费接口，中文返回，Redis 缓存）
 * @param {string} ip
 * @returns {Promise<{province: string, city: string}>}
 */
async function resolveIpLocation(ip) {
  const cleanIp = (ip || '').replace(/^::ffff:/, '');

  if (isPrivateIp(cleanIp)) {
    return { province: '本地', city: '本地/内网' };
  }

  const cacheKey = `${CACHE_PREFIX}${cleanIp}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch { /* redis 不可用时直接走接口 */ }

  try {
    const { data } = await axios.get(
      `http://ip-api.com/json/${encodeURIComponent(cleanIp)}`,
      {
        params: { lang: 'zh-CN', fields: 'status,country,regionName,city' },
        timeout: 5000
      }
    );

    let location;
    if (data && data.status === 'success') {
      const isChina = data.country === '中国';
      location = {
        province: isChina ? normalizeProvince(data.regionName) : (data.country || '海外'),
        city: data.city || data.regionName || '未知'
      };
    } else {
      location = { province: '未知', city: '未知' };
    }

    try {
      await redis.set(cacheKey, JSON.stringify(location), 'EX', CACHE_TTL);
    } catch { /* ignore */ }

    return location;
  } catch (err) {
    // 接口失败不影响主流程
    return { province: '未知', city: '未知' };
  }
}

module.exports = { resolveIpLocation, isPrivateIp, normalizeProvince };
