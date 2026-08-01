const axios = require('axios');

/**
 * Pixabay 图片适配器
 * 官方 API 文档：https://pixabay.com/api/docs/
 *
 * 接口：
 *   GET https://pixabay.com/api/?key={API_KEY}&q={kw}&page={n}&per_page={size}
 *   鉴权：URL Query 参数 key
 *
 * 合规说明：
 * 1. Pixabay 内容遵循 Pixabay Content License（可免费商用，无需署名）
 * 2. 仍标注 user（作者）与源页 URL，便于追溯
 * 3. 接口限流：每分钟约 100 次请求
 */

const PIXABAY_API = 'https://pixabay.com/api/';

function getApiKey() {
  const configService = require('../configService');
  return configService.getConfig('pixabay_api_key', '') || (require('../config').imageCrawler?.pixabayApiKey || '');
}

function ensureApiKey() {
  const key = getApiKey();
  if (!key) {
    const err = new Error('未配置 Pixabay API Key，请在「系统设置 → 图片抓取」中填写');
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
  id: 'pixabay',
  label: 'Pixabay',
  type: 'image',

  /**
   * 搜索图片
   * @param {string} keyword
   * @param {number} page - 从 1 开始
   * @param {number} pageSize - Pixabay 单页最大 200，最小 3
   */
  async search(keyword, page = 1, pageSize = 20) {
    if (!keyword || !keyword.trim()) return { total: 0, list: [] };

    const apiKey = ensureApiKey();
    // Pixabay 要求 per_page 在 [3, 200]
    const perPage = Math.max(3, Math.min(200, pageSize));

    try {
      const res = await axios.get(PIXABAY_API, {
        params: {
          key: apiKey,
          q: keyword,
          page,
          per_page: perPage,
          image_type: 'all',
          safesearch: true,
          lang: 'zh'
        },
        timeout: 15000,
        headers: {
          Accept: 'application/json'
        }
      });

      const data = res.data || {};
      const hits = Array.isArray(data.hits) ? data.hits : [];

      const mapped = hits.map((h) => {
        const original = h.largeImageURL || h.imageURL || h.webformatURL || '';
        const thumb = h.previewURL || h.webformatURL || original;
        // Pixabay 不直接返回详情页 URL，用 id 拼一个
        const sourceUrl = h.pageURL || `https://pixabay.com/photos/${h.id}/`;
        return {
          id: String(h.id),
          title: h.tags ? h.tags.split(',')[0].trim() : `Pixabay-${h.id}`,
          thumb,
          original,
          source_url: sourceUrl,
          author: h.user || 'Pixabay',
          width: h.imageWidth || 0,
          height: h.imageHeight || 0,
          format: detectFormat(original)
        };
      }).filter(it => it.thumb && it.original);

      return {
        total: data.totalHits || mapped.length,
        list: mapped
      };
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400) {
        throw new Error('Pixabay API Key 无效或参数错误，请检查设置');
      }
      if (status === 429) {
        throw new Error('Pixabay API 调用频率超限（每分钟 100 次），请稍后再试');
      }
      throw new Error(`Pixabay 搜索失败：${err.message}`);
    }
  },

  /**
   * 下载原图为 Buffer
   * @param {object} item - search 返回的列表项
   */
  async fetchOriginal(item) {
    if (!item?.original) throw new Error('图片原图 URL 为空');

    const res = await axios.get(item.original, {
      timeout: 30000,
      responseType: 'arraybuffer',
      headers: {
        Referer: item.source_url || 'https://pixabay.com/'
      }
    });

    const mime = res.headers['content-type'] || 'image/jpeg';
    const ext = mimeToExt(mime, item.format);
    return {
      buffer: Buffer.from(res.data),
      mimetype: mime,
      filename: `pixabay-${item.id}.${ext}`
    };
  }
};
