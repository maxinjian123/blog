const axios = require('axios');

/**
 * Pexels 图片适配器
 * 官方 API 文档：https://www.pexels.com/api/documentation/
 *
 * 接口：
 *   GET https://api.pexels.com/v1/search?query={kw}&page={n}&per_page={size}
 *   鉴权：HTTP Header Authorization: API_KEY
 *
 * 合规说明：
 * 1. Pexels 内容遵循 Pexels License（可免费商用，无需署名）
 * 2. 仍标注 photographer（作者）与源页 URL，便于追溯
 * 3. 接口限流：每小时 200 次请求，每月 20000 次
 */

const PEXELS_API = 'https://api.pexels.com/v1/search';

function getApiKey() {
  const configService = require('../configService');
  return configService.getConfig('pexels_api_key', '') || (require('../config').imageCrawler?.pexelsApiKey || '');
}

function ensureApiKey() {
  const key = getApiKey();
  if (!key) {
    const err = new Error('未配置 Pexels API Key，请在「系统设置 → 图片抓取」中填写');
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

module.exports = {
  id: 'pexels',
  label: 'Pexels',
  type: 'image',

  /**
   * 搜索图片
   * @param {string} keyword
   * @param {number} page - 从 1 开始
   * @param {number} pageSize
   */
  async search(keyword, page = 1, pageSize = 20) {
    if (!keyword || !keyword.trim()) return { total: 0, list: [] };

    const apiKey = ensureApiKey();

    try {
      const res = await axios.get(PEXELS_API, {
        params: {
          query: keyword,
          page,
          per_page: pageSize
        },
        timeout: 15000,
        headers: {
          Authorization: apiKey,
          Accept: 'application/json'
        }
      });

      const data = res.data || {};
      const photos = Array.isArray(data.photos) ? data.photos : [];

      const mapped = photos.map((p) => ({
        id: String(p.id),
        title: p.alt || `Pexels-${p.id}`,
        thumb: p.src?.medium || p.src?.small || p.src?.tiny || p.src?.original || '',
        original: p.src?.original || p.src?.large || '',
        source_url: p.url || '',
        author: p.photographer || 'Pexels',
        width: p.width || 0,
        height: p.height || 0,
        format: detectFormat(p.src?.original)
      })).filter(it => it.thumb && it.original);

      return {
        total: data.total_results || mapped.length,
        list: mapped
      };
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        throw new Error('Pexels API Key 无效，请检查设置');
      }
      if (status === 429) {
        throw new Error('Pexels API 调用频率超限（每小时 200 次），请稍后再试');
      }
      throw new Error(`Pexels 搜索失败：${err.message}`);
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
        // Pexels 不强制 Referer，但带上源页有助于追溯
        Referer: item.source_url || 'https://www.pexels.com/'
      }
    });

    const mime = res.headers['content-type'] || 'image/jpeg';
    const ext = mimeToExt(mime, item.format);
    return {
      buffer: Buffer.from(res.data),
      mimetype: mime,
      filename: `pexels-${item.id}.${ext}`
    };
  }
};

function detectFormat(url) {
  const m = String(url).match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}
