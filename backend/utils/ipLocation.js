const axios = require('axios');
const redis = require('./redis');

const CACHE_PREFIX = 'ip_location:';
const CACHE_TTL = 86400 * 7; // 同一IP归属地缓存7天

// 国家代码 -> 中文名（兜底，仅当备源只返回英文时使用）
const COUNTRY_CN_MAP = {
  CN: '中国', HK: '中国', TW: '中国', MO: '中国',
  US: '美国', JP: '日本', KR: '韩国', SG: '新加坡',
  GB: '英国', DE: '德国', FR: '法国', CA: '加拿大',
  AU: '澳大利亚', RU: '俄罗斯', IN: '印度', TH: '泰国',
  VN: '越南', MY: '马来西亚', ID: '印度尼西亚', PH: '菲律宾',
  IT: '意大利', ES: '西班牙', NL: '荷兰', BR: '巴西',
  NZ: '新西兰', AE: '阿联酋', SA: '沙特阿拉伯', EG: '埃及',
  ZA: '南非', TR: '土耳其', MX: '墨西哥', AR: '阿根廷',
  SE: '瑞典', CH: '瑞士', PL: '波兰', BE: '比利时',
  PT: '葡萄牙', GR: '希腊', AT: '奥地利', DK: '丹麦',
  FI: '芬兰', NO: '挪威', IE: '爱尔兰', IL: '以色列',
  PK: '巴基斯坦', BD: '孟加拉国', LK: '斯里兰卡', KZ: '哈萨克斯坦',
  UA: '乌克兰', CZ: '捷克', HU: '匈牙利', RO: '罗马尼亚'
};

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
 * 主源：ip-api.com（HTTP，中文返回，免费 45次/分钟）
 * 失败时返回 null，由调用方走备源
 */
async function lookupWithIpApi(cleanIp) {
  const { data } = await axios.get(
    `http://ip-api.com/json/${encodeURIComponent(cleanIp)}`,
    {
      params: { lang: 'zh-CN', fields: 'status,country,regionName,city' },
      timeout: 5000
    }
  );
  if (data && data.status === 'success') {
    const isChina = data.country === '中国';
    return {
      province: isChina ? normalizeProvince(data.regionName) : (data.country || '海外'),
      city: data.city || data.regionName || '未知'
    };
  }
  return null;
}

/**
 * 备源：ipwho.is（HTTPS，免费，无需 token）
 * 在主源失败或被限速时回退使用；默认英文返回，省份通过国家代码映射转中文
 */
async function lookupWithIpwhoIs(cleanIp) {
  const { data } = await axios.get(
    `https://ipwho.is/${encodeURIComponent(cleanIp)}`,
    { timeout: 5000 }
  );
  if (data && data.success === true) {
    const countryCode = data.country_code;
    const isChina = countryCode === 'CN';
    const countryCn = COUNTRY_CN_MAP[countryCode] || data.country || '海外';
    return {
      province: isChina ? normalizeProvince(data.region) : countryCn,
      city: data.city || data.region || '未知'
    };
  }
  return null;
}

/**
 * 解析 IP 归属地（多源回退 + Redis 缓存）
 * 主源 ip-api.com 失败时自动回退到 ipwho.is，全部失败返回"未知"
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

  let location = null;
  let primaryError = null;

  // 主源
  try {
    location = await lookupWithIpApi(cleanIp);
  } catch (err) {
    primaryError = err;
    console.error(`[ipLocation] 主源 ip-api.com 解析失败 (ip=${cleanIp}): ${err.message}`);
  }

  // 备源：主源抛错或返回 null（接口成功但查询失败）时回退
  if (!location) {
    try {
      location = await lookupWithIpwhoIs(cleanIp);
    } catch (err) {
      console.error(`[ipLocation] 备源 ipwho.is 解析失败 (ip=${cleanIp}): ${err.message}`);
    }
  }

  if (!location) {
    location = { province: '未知', city: '未知' };
    console.error(`[ipLocation] 所有源均不可用 (ip=${cleanIp})，本次归为"未知"`);
  }

  // 即使是"未知"也缓存，避免短时间反复打挂的接口被刷爆（TTL 可缩短为 1 天）
  const ttl = (location.province === '未知') ? 86400 : CACHE_TTL;
  try {
    await redis.set(cacheKey, JSON.stringify(location), 'EX', ttl);
  } catch { /* ignore */ }

  return location;
}

module.exports = { resolveIpLocation, isPrivateIp, normalizeProvince };
