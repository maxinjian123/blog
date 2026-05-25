const redis = require('./redis');

/**
 * 限流工具 - 基于 Redis 的简单限流
 *
 * @param {string} keyPrefix - Redis key 前缀，如 'rate_limit:comment'
 * @param {number} maxRequests - 最大请求次数
 * @param {number} windowSeconds - 时间窗口（秒）
 * @param {Function} keyFn - 生成唯一 key 的函数，接收 req 返回 string
 * @returns {Function} Express 中间件
 */
function createRateLimit({keyPrefix, maxRequests, windowSeconds, keyFn}) {
  if (!keyPrefix || !maxRequests || !windowSeconds) {
    throw new Error('createRateLimit: keyPrefix, maxRequests, windowSeconds 为必填参数');
  }

  // 默认使用 IP 作为 key
  const getKey = keyFn || ((req) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
    return `${keyPrefix}:${ip}`;
  });

  return async function rateLimitMiddleware(req, res, next) {
    try {
      const key = getKey(req);
      const current = await redis.get(key);

      if (current && parseInt(current) >= maxRequests) {
        const ttl = await redis.ttl(key);
        return res.status(429).json({
          code: 429,
          message: `操作过于频繁，请 ${ttl > 0 ? ttl + ' 秒' : '稍'}后再试`,
          data: null
        });
      }

      if (!current) {
        await redis.set(key, '1', 'EX', windowSeconds);
      } else {
        const ttl = await redis.ttl(key);
        await redis.set(key, String(parseInt(current) + 1), 'EX', ttl > 0 ? ttl : windowSeconds);
      }

      next();
    } catch (err) {
      // Redis 不可用时降级放行
      console.warn('[RateLimit] Redis 限流失败，放行:', err.message);
      next();
    }
  };
}

/**
 * 检查是否已达限流上限（非中间件版本，返回 boolean）
 */
async function isRateLimited(keyPrefix, identifier, maxRequests, windowSeconds) {
  try {
    const key = `${keyPrefix}:${identifier}`;
    const current = await redis.get(key);
    return current && parseInt(current) >= maxRequests;
  } catch {
    return false;
  }
}

module.exports = {createRateLimit, isRateLimited};