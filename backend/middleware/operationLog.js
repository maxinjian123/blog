const {OperationLog} = require('../models');

/**
 * 敏感字段名列表（小写匹配），请求体中这些字段的值会被替换为 ***
 */
const SENSITIVE_FIELDS = [
  'password', 'password_confirm', 'old_password', 'new_password',
  'mail_pass', 'mail_password', 'smtp_pass',
  'api_key', 'apikey', 'secret', 'secret_key', 'access_key',
  'token', 'access_token', 'refresh_token', 'auth_token',
  'authorization', 'cookie',
  'private_key', 'client_secret',
  'pexels_api_key', 'pixabay_api_key', 'unsplash_api_key', 'doubao_api_key',
  'minio_secret_key', 'github_token'
];

/**
 * 请求体脱敏：递归遍历对象，将敏感字段的值替换为 ***
 * 同时限制序列化后最大长度 2KB
 */
function sanitizeRequestBody(body, maxLen = 2048) {
  if (!body || typeof body !== 'object') return null;

  try {
    const sanitized = sanitizeDeep(body);
    let json = JSON.stringify(sanitized);
    // 超长截断
    if (json.length > maxLen) {
      json = json.substring(0, maxLen) + '...(truncated)';
    }
    return json;
  } catch {
    return null;
  }
}

function sanitizeDeep(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.slice(0, 50).map(sanitizeDeep); // 数组限 50 项
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      result[key] = '***';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeDeep(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * 路由模式 → 模块映射
 * 按路径前缀匹配，自动推断操作模块
 * 同时匹配 /admin/xxx 和 /api/v1/xxx 两种路径风格
 */
const ROUTE_MODULE_MAP = [
  {pattern: /\/(admin\/)?emojis/i, module: 'emoji', label: '表情'},
  {pattern: /\/(admin\/)?backups\/restore-upload/i, module: 'backup', label: '数据备份', action: 'restore'},
  {pattern: /\/(admin\/)?backups\/[^/]+\/restore/i, module: 'backup', label: '数据备份', action: 'restore'},
  {pattern: /\/(admin\/)?backups\/[^/]+\/download/i, module: 'backup', label: '数据备份', action: 'download'},
  {pattern: /\/(admin\/)?backups\/upload/i, module: 'backup', label: '数据备份', action: 'upload'},
  {pattern: /\/(admin\/)?backups/i, module: 'backup', label: '数据备份'},
  {pattern: /\/(admin\/)?articles/i, module: 'article', label: '文章'},
  {pattern: /\/(admin\/)?categories/i, module: 'category', label: '分类'},
  {pattern: /\/(admin\/)?tags/i, module: 'tag', label: '标签'},
  {pattern: /\/(admin\/)?comments/i, module: 'comment', label: '评论'},
  {pattern: /\/(admin\/)?links/i, module: 'link', label: '友链'},
  {pattern: /\/(admin\/)?media/i, module: 'media', label: '媒体'},
  {pattern: /\/(admin\/)?music/i, module: 'music', label: '音乐'},
  {pattern: /\/(admin\/)?playlists/i, module: 'playlist', label: '播放列表'},
  {pattern: /\/(admin\/)?announcements/i, module: 'announcement', label: '公告'},
  {pattern: /\/(admin\/)?subscribers/i, module: 'subscriber', label: '订阅者'},
  {pattern: /\/admin\/settings/i, module: 'config', label: '系统配置'},
  {pattern: /\/(admin\/)?users/i, module: 'user', label: '用户'},
  {pattern: /\/(admin\/)?guestbook/i, module: 'guestbook', label: '留言板'},
  {pattern: /\/(admin\/)?messages/i, module: 'message', label: '消息'},
  {pattern: /\/(admin\/)?client-pages/i, module: 'client_page', label: '自定义页面'},
  {pattern: /\/auth\/login/i, module: 'auth', label: '认证', action: 'login'},
  {pattern: /\/auth\/logout/i, module: 'auth', label: '认证', action: 'logout'},
  {pattern: /\/auth\/github/i, module: 'auth', label: '认证', action: 'github_login'},
  {pattern: /\/image-crawler\/download/i, module: 'image_crawler', label: '图片抓取', action: 'download'},
  {pattern: /\/image-crawler\/batch-download/i, module: 'image_crawler', label: '图片抓取', action: 'batch_download'},
  {pattern: /\/music\/upload/i, module: 'music', label: '音乐', action: 'upload'},
  {pattern: /\/music\/upload-from-url/i, module: 'music', label: '音乐', action: 'upload_from_url'},
  {pattern: /\/crawler\/github/i, module: 'crawler', label: 'GitHub爬虫', action: 'import'}
];

/**
 * HTTP 方法 → 默认操作类型
 */
const METHOD_ACTION_MAP = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete'
};

/**
 * 从路径中提取目标 ID（最后一个路径段，且为 UUID 或数字）
 */
function extractTargetId(path) {
  const segments = path.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return null;
  // UUID 或纯数字
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last) || /^\d+$/.test(last)) {
    return last;
  }
  return null;
}

/**
 * 推断模块和操作类型
 */
function inferModuleAction(req) {
  const path = req.originalUrl || req.url || '';
  // 去除 query string
  const cleanPath = path.split('?')[0];

  for (const route of ROUTE_MODULE_MAP) {
    if (route.pattern.test(cleanPath)) {
      return {
        module: route.module,
        action: route.action || METHOD_ACTION_MAP[req.method] || req.method.toLowerCase()
      };
    }
  }
  return null;
}

/**
 * 获取客户端 IP
 */
function getClientIp(req) {
  return req.ip ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '';
}

/**
 * 操作日志记录中间件
 * 仅记录写操作（POST/PUT/PATCH/DELETE），自动推断模块和操作类型
 * 路由内可通过 res.locals.logMeta = { target_name, target_id, action } 补充业务信息
 */
function operationLogger() {
  return (req, res, next) => {
    // 只记录写操作
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const startTime = Date.now();

    // 响应结束时记录日志
    res.on('finish', () => {
      const inferred = inferModuleAction(req);
      // 未匹配到已知模块的请求不记录（避免噪音）
      if (!inferred) return;

      // 仅记录管理员操作（auth 模块除外，登录时 req.user 尚未设置）
      if (inferred.module !== 'auth' && req.user?.role !== 'admin') return;

      const logMeta = res.locals.logMeta || {};
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const isSuccess = statusCode < 400;

      // 异步写入，不阻塞响应
      OperationLog.create({
        user_id: req.user?.id || null,
        username: req.user?.username || '',
        module: inferred.module,
        action: logMeta.action || inferred.action,
        target_id: logMeta.target_id || extractTargetId(req.originalUrl || req.url || '') || null,
        target_name: logMeta.target_name || null,
        method: req.method,
        path: (req.originalUrl || req.url || '').split('?')[0].substring(0, 255),
        ip: getClientIp(req).substring(0, 50),
        user_agent: (req.headers['user-agent'] || '').substring(0, 500),
        status: isSuccess ? 'success' : 'fail',
        status_code: statusCode,
        error_msg: logMeta.error_msg || (isSuccess ? null : `HTTP ${statusCode}`),
        duration,
        request_body: sanitizeRequestBody(req.body)
      }).catch(err => {
        console.error('[OperationLog] 记录失败:', err.message);
      });
    });

    next();
  };
}

module.exports = {
  operationLogger,
  sanitizeRequestBody,
  SENSITIVE_FIELDS
};
