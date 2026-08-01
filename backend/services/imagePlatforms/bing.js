const axios = require('axios');

/**
 * Bing 图片适配器
 * 通过解析 Bing 图片搜索异步接口返回的元数据获取图片列表
 *
 * 合规说明：
 * 1. 标注来源 URL 供后续版权追溯
 * 2. 实现请求频率控制，避免对方服务器压力
 */

const BING_BASE = 'https://www.bing.com';
const LAST_REQUEST_AT = { value: 0 };
const MIN_INTERVAL_MS = 1500;

// 爬虫 UA：使用主流浏览器 UA 避免被 Bing 拦截
const CRAWLER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function waitRateLimit() {
  const now = Date.now();
  const elapsed = now - LAST_REQUEST_AT.value;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  LAST_REQUEST_AT.value = Date.now();
}

/**
 * HTML 实体解码
 */
function decodeEntities(s) {
  if (!s) return '';
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}

/**
 * 解析 Bing Images Async 接口返回的 HTML
 * 数据结构（已实测验证）：
 *   <div class="iuscp isv ..." style="..." data-hovstyle="" data-evt="1">
 *     <a class="iusc" ... m="{json}">
 *   m 属性 JSON 含字段：
 *     murl  - 原图 URL
 *     purl  - 来源页 URL
 *     turl  - Bing 缩略图 URL
 *     t     - 标题
 *     desc  - 描述
 *     mw/mh - 原图宽高
 */
function parseImageResults(html) {
  const results = [];
  if (!html) return results;

  // 匹配所有 m="..." 中的 JSON 内容（长度限制 50+ 以排除空值）
  // 使用 [^"] 配合实体解码后的内容
  const mRegex = /m="([^"]{50,})"/g;
  let match;
  while ((match = mRegex.exec(html)) !== null) {
    const raw = decodeEntities(match[1]);
    try {
      const data = JSON.parse(raw);
      const murl = data.murl || '';
      if (!murl) continue;

      // 原图 URL 作为唯一 id（base64url 截断）
      const id = Buffer.from(murl).toString('base64url').slice(0, 64);
      const title = (data.t || data.desc || '未命名').replace(/<[^>]+>/g, '').trim();

      results.push({
        id,
        title,
        thumb: data.turl || '',
        original: murl,
        source_url: data.purl || '',
        author: extractDomain(data.purl) || '',
        width: data.mw || 0,
        height: data.mh || 0,
        format: detectFormat(murl)
      });
    } catch {
      // 单条解析失败忽略
    }
  }
  return results;
}

function extractDomain(url) {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

function detectFormat(url) {
  const m = String(url).match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

function mimeToExt(mime, fallback) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg'
  };
  return map[mime] || fallback || 'jpg';
}

module.exports = {
  id: 'bing',
  label: 'Bing 图片',
  type: 'image',

  /**
   * 搜索图片
   * @param {string} keyword
   * @param {number} page
   * @param {number} pageSize
   */
  async search(keyword, page = 1, pageSize = 20) {
    if (!keyword || !keyword.trim()) return { total: 0, list: [] };

    const targetUrl =
      `${BING_BASE}/images/async?q=${encodeURIComponent(keyword)}` +
      `&first=${(page - 1) * pageSize + 1}&count=${pageSize}`;

    await waitRateLimit();

    try {
      const res = await axios.get(targetUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': CRAWLER_USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
      });

      const list = parseImageResults(res.data);
      // Bing async 不直接返回 total，估算：每页 pageSize 条，最多 1000 页
      return {
        total: list.length < pageSize && page === 1 ? list.length : 1000,
        list
      };
    } catch (err) {
      throw new Error(`Bing 图片搜索失败：${err.message}`);
    }
  },

  /**
   * 下载图片原图为 Buffer
   * @param {object} item - search 返回的列表项
   */
  async fetchOriginal(item) {
    if (!item?.original) throw new Error('图片原图 URL 为空');

    await waitRateLimit();

    const res = await axios.get(item.original, {
      timeout: 30000,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': CRAWLER_USER_AGENT,
        Referer: item.source_url || BING_BASE
      }
    });

    const mime = res.headers['content-type'] || 'image/jpeg';
    const ext = mimeToExt(mime, item.format);
    return {
      buffer: Buffer.from(res.data),
      mimetype: mime,
      filename: `${item.id}.${ext}`
    };
  }
};
