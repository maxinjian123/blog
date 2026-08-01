const axios = require('axios');

/**
 * dogetu.com 表情包适配器
 *
 * 站点结构（已实测验证）：
 * - 搜索：GET https://www.dogetu.com/search?keyword={kw}&page={n}
 *   每页约 12-24 条，结果项结构：
 *     <div class="item">
 *       <div class="item-pic">
 *         <a href="/view/{id}.html" title="{title}"><img src="{thumb}"/></a>
 *       </div>
 *       <a href="/view/{id}.html" class="item-title">{title}</a>
 *     </div>
 *   缩略图域名：https://www.dogetu.com/data/doutula/{hash}.jpg
 * - 详情页：GET https://www.dogetu.com/view/{id}.html
 *   包含一张原图
 * - 分页：/search?keyword={kw}&page={n}，最多 10 页
 *
 * 合规措施：
 * 1. 标注每张表情包的来源页 URL 和作者（站点域名）
 * 2. 请求间隔 2 秒，避免压力
 */

const DOGETU_BASE = 'https://www.dogetu.com';
const LAST_REQUEST_AT = { value: 0 };
const MIN_INTERVAL_MS = 2000;

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
 * 解析搜索结果页 HTML
 * 结构：
 *   <a href="/view/{id}.html" title="{title}" ...><img src="{thumb}" ... /></a>
 *   ...
 *   <a href="/view/{id}.html" class="item-title" ...>{title}</a>
 */
function parseSearchResults(html) {
  const results = [];
  if (!html) return results;

  // 匹配 <a href="/view/{id}.html" title="{title}" ...><img src="{thumb}" .../></a>
  // 注意 title 是 HTML 实体编码
  const itemRegex = /<a[^>]+href="\/view\/(\d+)\.html"[^>]+title="([^"]*)"[^>]*>\s*<img[^>]+src="([^"]+)"/g;
  let m;
  const seenIds = new Set();
  while ((m = itemRegex.exec(html)) !== null) {
    const id = m[1];
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const titleRaw = decodeEntities(m[2] || '');
    const thumb = decodeEntities(m[3] || '');
    if (!thumb) continue;

    results.push({
      id,
      title: titleRaw || `dogetu-${id}`,
      thumb,
      original: thumb, // 详情页解析后会被替换为原图
      source_url: `${DOGETU_BASE}/view/${id}.html`,
      author: 'dogetu.com',
      width: 0,
      height: 0,
      format: detectFormat(thumb)
    });
  }
  return results;
}

/**
 * 解析详情页，提取原图 URL
 */
function parseDetailImage(html) {
  if (!html) return null;
  // 详情页主图：优先匹配详情内容区的 img
  // 常见模式：<img src="..." alt="..." /> 在 .content-detail 或类似容器中
  const patterns = [
    /<div[^>]+class="[^"]*detail[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i,
    /<div[^>]+class="[^"]*content[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i,
    /<img[^>]+src="(https?:\/\/[^"]+)"[^>]+alt="[^"]*"/i
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decodeEntities(m[1]);
  }
  return null;
}

/**
 * 解析搜索页总页数
 * 分页：<a href="/search?keyword=xx&page=N">N</a>
 */
function parseTotalPages(html) {
  const re = /page=(\d+)/g;
  let m;
  let maxPage = 1;
  while ((m = re.exec(html)) !== null) {
    const p = parseInt(m[1], 10);
    if (!isNaN(p) && p > maxPage) maxPage = p;
  }
  return maxPage;
}

function detectFormat(url) {
  const m = String(url).match(/\.(jpe?g|png|gif|webp|bmp)$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

function mimeToExt(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  return map[mime] || 'jpg';
}

module.exports = {
  id: 'dogetu',
  label: 'dogetu 表情包',
  type: 'meme',

  /**
   * 搜索表情包
   */
  async search(keyword, page = 1, pageSize = 20) {
    if (!keyword || !keyword.trim()) return { total: 0, list: [] };

    const targetUrl = `${DOGETU_BASE}/search?keyword=${encodeURIComponent(keyword)}&page=${page}`;

    await waitRateLimit();

    try {
      const res = await axios.get(targetUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': CRAWLER_USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9'
        }
      });

      const list = parseSearchResults(res.data);
      const maxPage = parseTotalPages(res.data);
      // 估算总数：每页约 24 条（dogetu 单页约 24 个表情包）
      const perPage = 24;
      const total = maxPage * perPage;
      return {
        total,
        list: list.slice(0, pageSize)
      };
    } catch (err) {
      throw new Error(`dogetu 搜索失败：${err.message}`);
    }
  },

  /**
   * 下载原图：先解析详情页获取原图 URL，再下载
   * @param {object} item - search 返回的列表项
   */
  async fetchOriginal(item) {
    if (!item?.source_url) throw new Error('表情包详情页 URL 为空');

    await waitRateLimit();

    // 1. 拉取详情页解析原图 URL
    let originalUrl = item.original;
    try {
      const res = await axios.get(item.source_url, {
        timeout: 15000,
        headers: {
          'User-Agent': CRAWLER_USER_AGENT,
          Accept: 'text/html,application/xhtml+xml'
        }
      });
      const parsed = parseDetailImage(res.data);
      if (parsed) originalUrl = parsed;
    } catch (err) {
      // 详情页拉取失败，降级使用缩略图
      console.warn('[Dogetu] 详情页解析失败，使用缩略图:', err.message);
    }

    // 2. 下载原图
    await waitRateLimit();

    const res = await axios.get(originalUrl, {
      timeout: 30000,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': CRAWLER_USER_AGENT,
        Referer: item.source_url
      }
    });

    const mime = res.headers['content-type'] || 'image/jpeg';
    const ext = mimeToExt(mime);
    return {
      buffer: Buffer.from(res.data),
      mimetype: mime,
      filename: `dogetu-${item.id}.${ext}`,
      originalUrl
    };
  }
};
