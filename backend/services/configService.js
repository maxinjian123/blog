const { SiteConfig, MediaFile, sequelize } = require('../models');
const config = require('../config');

// 默认配置（首次启动时写入数据库）
const DEFAULT_CONFIGS = [
  // 站点基本信息
  { config_key: 'site_name', config_value: 'TechMind Blog', category: 'site', description: '站点名称' },
  { config_key: 'site_description', config_value: '记录技术学习与思考的个人博客', category: 'site', description: '站点描述' },
  { config_key: 'site_url', config_value: '', category: 'site', description: '站点地址（用于邮件链接、sitemap）' },
  { config_key: 'site_logo', config_value: '/logo.svg', category: 'site', description: '站点 Logo 地址（客户端/管理端共用，支持本地路径或完整 URL）' },
  { config_key: 'admin_email', config_value: '', category: 'site', description: '管理员邮箱' },

  // 邮件服务
  { config_key: 'mail_host', config_value: 'smtp.qq.com', category: 'mail', description: 'SMTP 服务器地址' },
  { config_key: 'mail_port', config_value: '465', category: 'mail', description: 'SMTP 端口' },
  { config_key: 'mail_secure', config_value: 'true', category: 'mail', description: '是否启用 SSL' },
  { config_key: 'mail_user', config_value: '', category: 'mail', description: '发件邮箱账号' },
  { config_key: 'mail_pass', config_value: '', category: 'mail', description: 'SMTP 授权码' },
  { config_key: 'mail_from_name', config_value: 'LinzyBlog', category: 'mail', description: '发件人显示名称' },

  // 上传配置 - 本地
  { config_key: 'upload_dir', config_value: './uploads', category: 'upload', description: '本地上传目录' },
  { config_key: 'upload_max_size', config_value: '10mb', category: 'upload', description: '文件大小上限' },
  { config_key: 'upload_default_storage', config_value: 'local', category: 'upload', description: '默认上传源：local / minio' },

  // 上传配置 - MinIO
  { config_key: 'minio_enabled', config_value: 'false', category: 'upload', description: '是否启用 MinIO' },
  { config_key: 'minio_endpoint', config_value: 'http://111.228.9.147:9000', category: 'upload', description: 'MinIO 服务地址' },
  { config_key: 'minio_port', config_value: '9000', category: 'upload', description: 'MinIO 端口' },
  { config_key: 'minio_use_ssl', config_value: 'false', category: 'upload', description: 'MinIO 是否使用 SSL' },
  { config_key: 'minio_access_key', config_value: 'admin', category: 'upload', description: 'MinIO AccessKey' },
  { config_key: 'minio_secret_key', config_value: 'admin123', category: 'upload', description: 'MinIO SecretKey' },
  { config_key: 'minio_bucket', config_value: 'blog', category: 'upload', description: 'MinIO 桶名' },
  { config_key: 'minio_public_base_url', config_value: 'http://111.228.9.147:9000', category: 'upload', description: 'MinIO 公开访问基址（用于拼接 URL）' },
  { config_key: 'minio_region', config_value: '', category: 'upload', description: 'MinIO Region（非空时覆盖默认 region，如 us-east-1）' },

  // 爬虫配置 - GitHub
  { config_key: 'github_token', config_value: '', category: 'crawler', description: 'GitHub Personal Access Token（用于仓库搜索与内容爬取，避免 60次/小时限流）' },

  // 图片抓取 - 第三方平台 API Key
  { config_key: 'pexels_api_key', config_value: '', category: 'image_crawler', description: 'Pexels API Key（在 https://www.pexels.com/api/ 申请）' },
  { config_key: 'pixabay_api_key', config_value: '', category: 'image_crawler', description: 'Pixabay API Key（在 https://pixabay.com/accounts/register/ 申请）' },
  { config_key: 'unsplash_api_key', config_value: '', category: 'image_crawler', description: 'Unsplash Access Key（在 https://unsplash.com/developers 申请）' },

  // AI 配置 - 豆包（火山引擎）
  { config_key: 'doubao_api_key', config_value: '', category: 'ai', description: '豆包 API Key（火山引擎控制台获取）' },
  { config_key: 'doubao_base_url', config_value: 'https://ark.cn-beijing.volces.com/api/v3', category: 'ai', description: '豆包 API Base URL' },
  { config_key: 'doubao_chat_model', config_value: '', category: 'ai', description: '豆包对话模型 ID' },
  { config_key: 'doubao_image_model', config_value: '', category: 'ai', description: '豆包图片生成模型 ID' },

  // AI 配置 - Ollama（本地对话模型）
  { config_key: 'ollama_host', config_value: 'http://localhost:11434', category: 'ai', description: 'Ollama 服务地址' },
  { config_key: 'ollama_chat_enabled', config_value: 'true', category: 'ai', description: '是否启用 Ollama 本地对话（不可用时降级到豆包云端）' },
  { config_key: 'ollama_chat_model', config_value: '', category: 'ai', description: 'Ollama 对话模型名称（如 glm4:9b）' }
];

// 敏感字段集合：API Key / 密码 / Token 类配置
// 这类字段在 getAllGrouped 返回时不返回明文，仅返回是否已配置的标志 hasValue
// 保存时如果提交空值或掩码占位符，后端跳过更新，保留原值
const SENSITIVE_KEYS = new Set([
  'mail_pass',
  'minio_secret_key',
  'github_token',
  'pexels_api_key',
  'pixabay_api_key',
  'unsplash_api_key',
  'doubao_api_key'
]);

// 内存中的配置缓存（启动后从数据库加载，避免每次读 DB）
const cache = {};

// 默认配置的 key 元数据映射，用于 setConfigs 推断 category / description
const KEY_META = Object.fromEntries(
  DEFAULT_CONFIGS.map(c => [c.config_key, { category: c.category, description: c.description }])
);

/**
 * 确保配置表存在（单独同步，避免全局 sync 在其他表上失败导致配置表无法创建）
 */
async function ensureTables() {
  try {
    await SiteConfig.sync();
    await MediaFile.sync();
  } catch (err) {
    console.error('[Config] 同步配置表失败:', err.message);
  }
}

/**
 * 初始化默认配置：数据库为空时写入全部默认值；已存在数据时补齐后续新增的配置项
 */
async function initDefaults() {
  try {
    await ensureTables();
    const count = await SiteConfig.count();
    if (count === 0) {
      await SiteConfig.bulkCreate(DEFAULT_CONFIGS);
      console.log('[Config] 已初始化默认配置');
      return;
    }
    // 补齐后续版本新增的默认配置项（已存在的配置不覆盖）
    const existingKeys = new Set(
      (await SiteConfig.findAll({ attributes: ['config_key'], raw: true }))
        .map(r => r.config_key)
    );
    const missing = DEFAULT_CONFIGS.filter(c => !existingKeys.has(c.config_key));
    if (missing.length > 0) {
      await SiteConfig.bulkCreate(missing);
      console.log(`[Config] 已补齐 ${missing.length} 项新增默认配置`);
    }
  } catch (err) {
    console.error('[Config] 初始化默认配置失败:', err.message);
  }
}

/**
 * 从数据库加载所有配置到内存缓存，并同步到 config 对象
 */
async function loadConfigs() {
  try {
    const rows = await SiteConfig.findAll({ raw: true });
    for (const row of rows) {
      cache[row.config_key] = row.config_value;
    }
    applyToConfig();
    console.log(`[Config] 已加载 ${rows.length} 项配置`);
  } catch (err) {
    console.error('[Config] 加载配置失败:', err.message);
  }
}

/**
 * 将缓存同步到全局 config 对象（其它模块 require('../config') 即可拿到最新值）
 */
function applyToConfig() {
  // site
  config.site = {
    name: cache.site_name || config.site?.name || 'Blog',
    description: cache.site_description || '',
    url: cache.site_url || '',
    logo: cache.site_logo || '/logo.svg'
  };
  config.adminEmail = cache.admin_email || '';

  // mail
  config.mail = {
    host: cache.mail_host || 'smtp.qq.com',
    port: Number(cache.mail_port || 465),
    secure: String(cache.mail_secure) !== 'false',
    user: cache.mail_user || '',
    pass: cache.mail_pass || '',
    fromName: cache.mail_from_name || 'Blog'
  };

  // upload
  config.upload = {
    dir: cache.upload_dir || './uploads',
    maxSize: cache.upload_max_size || '10mb',
    defaultStorage: cache.upload_default_storage || 'local',
    minio: {
      enabled: String(cache.minio_enabled) === 'true',
      endpoint: cache.minio_endpoint || '',
      port: Number(cache.minio_port || 9000),
      useSSL: String(cache.minio_use_ssl) === 'true',
      accessKey: cache.minio_access_key || '',
      secretKey: cache.minio_secret_key || '',
      bucket: cache.minio_bucket || 'blog',
      publicBaseUrl: cache.minio_public_base_url || '',
      region: cache.minio_region || ''
    }
  };

  // crawler - GitHub
  config.crawler = {
    githubToken: cache.github_token || ''
  };

  // image_crawler - 第三方图片平台 API Key
  config.imageCrawler = {
    pexelsApiKey: cache.pexels_api_key || '',
    pixabayApiKey: cache.pixabay_api_key || '',
    unsplashApiKey: cache.unsplash_api_key || ''
  };

  // AI - 豆包（火山引擎）
  config.doubao = {
    apiKey: cache.doubao_api_key || '',
    baseURL: cache.doubao_base_url || 'https://ark.cn-beijing.volces.com/api/v3',
    chatModel: cache.doubao_chat_model || '',
    imageModel: cache.doubao_image_model || ''
  };

  // AI - Ollama（本地对话模型）
  config.ollama = {
    host: cache.ollama_host || 'http://localhost:11434',
    chatEnabled: String(cache.ollama_chat_enabled) === 'true',
    chatModel: cache.ollama_chat_model || ''
  };
}

/**
 * 重新从数据库加载配置（保存设置后调用）
 */
async function reloadConfig() {
  await loadConfigs();
}

/**
 * 同步读取单个配置值（从内存缓存）
 */
function getConfig(key, defaultValue = null) {
  return key in cache ? cache[key] : defaultValue;
}

/**
 * 批量更新配置（upsert），并刷新内存缓存
 * @param {Array<{key: string, value: string}>} items
 */
async function setConfigs(items) {
  for (const item of items) {
    // 敏感字段：提交空值或掩码占位符时跳过更新，保留原值
    // 前端对敏感字段不返回明文，用户未修改时提交空字符串
    if (SENSITIVE_KEYS.has(item.key)) {
      const v = String(item.value || '').trim();
      if (!v || v === '***' || v === '********' || v === '******') {
        continue;
      }
    }

    const meta = KEY_META[item.key] || {};
    const category = meta.category || item.category || 'general';
    const description = meta.description || item.description || null;

    const existing = await SiteConfig.findOne({ where: { config_key: item.key } });
    if (existing) {
      // 更新时同步修正 category / description，避免默认配置扩展后旧数据分组错误
      await existing.update({
        config_value: String(item.value),
        ...(existing.category !== category ? { category } : {}),
        ...(existing.description !== description ? { description } : {})
      });
    } else {
      await SiteConfig.create({
        config_key: item.key,
        config_value: String(item.value),
        category,
        description
      });
    }
    cache[item.key] = String(item.value);
  }
  applyToConfig();
}

/**
 * 获取所有配置（按分类分组，供前端使用）
 */
async function getAllGrouped() {
  const rows = await SiteConfig.findAll({
    attributes: ['config_key', 'config_value', 'category', 'description'],
    raw: true
  });
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = {};
    const isSensitive = SENSITIVE_KEYS.has(row.config_key);
    grouped[row.category][row.config_key] = {
      // 敏感字段不返回明文，仅返回是否已配置的标志
      value: isSensitive ? '' : row.config_value,
      hasValue: isSensitive ? !!row.config_value : undefined,
      isSensitive: isSensitive || undefined,
      description: row.description
    };
  }
  return grouped;
}

module.exports = {
  DEFAULT_CONFIGS,
  SENSITIVE_KEYS,
  initDefaults,
  loadConfigs,
  reloadConfig,
  getConfig,
  setConfigs,
  getAllGrouped,
  applyToConfig
};
