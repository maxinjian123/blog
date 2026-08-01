const axios = require('axios');

/**
 * Unsplash 图片适配器
 * 官方 API 文档：https://unsplash.com/documentation
 *
 * 接口：
 *   GET https://api.unsplash.com/search/photos?query={kw}&page={n}&per_page={size}
 *   鉴权：HTTP Header Authorization: Client-ID YOUR_ACCESS_KEY
 *
 * 合规说明：
 * 1. Unsplash 内容遵循 Unsplash License（免费商用，需署名摄影师）
 * 2. 必须保留 photographer 名称与源页 URL，下载存储时也会写入 MediaFile.author / source_url
 * 3. 接口限流：演示应用 50 次/小时，生产应用 5000 次/小时
 * 4. 触发下载需调用 download_location 接口；此处仅做搜索与原图获取
 */

const UNSPLASH_API = 'https://api.unsplash.com/search/photos';

function getApiKey() {
  const configService = require('../configService');
  return configService.getConfig('unsplash_api_key', '') || (require('../config').imageCrawler?.unsplashApiKey || '');
}

function ensureApiKey() {
  const key = getApiKey();
  if (!key) {
    const err = new Error('未配置 Unsplash Access Key，请在「系统设置 → 图片抓取」中填写');
    err.code = 'INVALID_PLATFORM';
    throw err;
  }
  return key;
}

function mimeToExt(mime, fallback) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };
  return map[mime] || fallback || 'jpg';
}

function detectFormat(url) {
  const m = String(url).match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

module.exports = {
  id: 'unsplash',
  label: 'Unsplash',
  type: 'image',

  /**
   * 搜索图片
   * @param {string} keyword
   * @param {number} page - 从 1 开始
   * @param {number} pageSize - Unsplash 单页最大 30
   */
  async search(keyword, page = 1, pageSize = 20) {
    if (!keyword || !keyword.trim()) return { total: 0, list: [] };

    const apiKey = ensureApiKey();
    // Unsplash 单页最大 30
    const perPage = Math.max(1, Math.min(30, pageSize));

    try {
      const res = await axios.get(UNSPLASH_API, {
        params: {
          query: keyword,
          page,
          per_page: perPage,
          content_filter: 'high'
        },
        timeout: 15000,
        headers: {
          Authorization: `Client-ID ${apiKey}`,
          Accept: 'application/json'
        }
      });

      const data = res.data || {};
      const results = Array.isArray(data.results) ? data.results : [];

      const mapped = results.map((p) => {
        const original = p.urls?.raw || p.urls?.full || p.urls?.regular || '';
        const thumb = p.urls?.small || p.urls?.thumb || original;
        return {
          id: p.id,
          title: p.alt_description || p.description || `Unsplash-${p.id}`,
          thumb,
          original,
          source_url: p.links?.html || '',
          author: p.user?.name || p.user?.username || 'Unsplash',
          // Unsplash raw URL 通常带 width/height query 参数控制尺寸；用 p.width/height 表示原图尺寸
          width: p.width || 0,
          height: p.height || 0,
          format: detectFormat(original)
        };
      }).filter(it => it.thumb && it.original);

      return {
        total: data.total || mapped.length,
        list: mapped
      };
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        throw new Error('Unsplash Access Key 无效，请检查设置');
      }
      if (status === 403) {
        throw new Error('Unsplash 访问被拒绝，请确认 Access Key 已激活');
      }
      if (status === 429) {
        throw new Error('Unsplash API 调用频率超限（演示 50 次/小时，生产 5000 次/小时），请稍后再试');
      }
      throw new Error(`Unsplash 搜索失败：${err.message}`);
    }
  },

  /**
   * 下载原图为 Buffer
   * 注意：Unsplash 规范要求触发下载时调用 download_location 端点（仅统计，不强制）
   * 此处直接下载原图 URL（已带 raw query），适用于内部使用
   * @param {object} item - search 返回的列表项
   */
  async fetchOriginal(item) {
    if (!item?.original) throw new Error('图片原图 URL 为空');

    // 限制下载尺寸，避免 raw 原图过大：在 URL 上加 w/q 参数（Unsplash 支持 Imgix-style 参数）
    const downloadUrl = appendSizeParam(item.original, 1600);

    const res = await axios.get(downloadUrl, {
      timeout: 30000,
      responseType: 'arraybuffer',
      headers: {
        Referer: item.source_url || 'https://unsplash.com/'
      }
    });

    const mime = res.headers['content-type'] || 'image/jpeg';
    const ext = mimeToExt(mime, item.format);
    return {
      buffer: Buffer.from(res.data),
      mimetype: mime,
      filename: `unsplash-${item.id}.${ext}`
    };
  }
};

/**
 * 在 Unsplash raw URL 上附加 w/q 参数限制下载尺寸
 * 仅当 URL 已包含 query（?）时追加 &w=xxx&q=85，否则追加 ?w=xxx&q=85
 */
function appendSizeParam(url, maxWidth) {
  if (!url) return url;
  // 已带 w= 参数则不重复添加
  if (/[?&]w=/.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}w=${maxWidth}&q=85&fit=max`;
}
