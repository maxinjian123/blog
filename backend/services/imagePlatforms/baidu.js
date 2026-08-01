const axios = require('axios');

/**
 * 百度图片适配器
 * 调用百度图片搜索的 JSON 接口（image.baidu.com/search/acjson）
 *
 * 合规说明：
 * 1. 标注来源 URL 供后续版权追溯（fromURL / fromURLHost）
 * 2. 实现请求频率控制，避免对方服务器压力
 * 3. 仅使用接口返回的 thumbURL（缩略图，可直接访问）作为可下载图
 *    objURL 是百度混淆的引用串，非直接可访问 URL，故不使用
 */

const BAIDU_API = 'https://image.baidu.com/search/acjson';
const LAST_REQUEST_AT = { value: 0 };
const MIN_INTERVAL_MS = 1500;

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
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, '&');
}

function detectFormat(url, typeField) {
  if (typeField && /^(jpe?g|png|gif|webp|bmp|svg)$/i.test(typeField)) {
    return typeField.toLowerCase();
  }
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
  id: 'baidu',
  label: '百度图片',
  type: 'image',

  /**
   * 搜索图片
   * @param {string} keyword
   * @param {number} page - 从 1 开始
   * @param {number} pageSize
   */
  async search(keyword, page = 1, pageSize = 20) {
    if (!keyword || !keyword.trim()) return { total: 0, list: [] };

    await waitRateLimit();

    try {
      const res = await axios.get(BAIDU_API, {
        params: {
          tn: 'resultjson_com',
          word: keyword,
          pn: (page - 1) * pageSize, // 起始位置
          rn: pageSize, // 每页数量
          ie: 'utf-8',
          oe: 'utf-8',
          ct: '201326592',
          z: '0',
          ipn: 'r',
          fp: 'result',
          queryWord: keyword,
          cl: '2',
          lm: '-1',
          st: '-1',
          ic: '0',
          sf: '1',
          fm: 'result'
        },
        timeout: 15000,
        headers: {
          'User-Agent': CRAWLER_USER_AGENT,
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          Referer: 'https://image.baidu.com/'
        }
      });

      const data = res.data || {};
      const list = Array.isArray(data.data) ? data.data : [];

      const mapped = list
        .filter((it) => it && (it.thumbURL || it.middleURL || it.hoverURL))
        .map((it) => {
          const thumb = it.thumbURL || it.middleURL || it.hoverURL;
          // 标题：优先 fromPageTitleEnc（已含编码），降级 fromPageTitle
          const title = decodeEntities(it.fromPageTitleEnc || it.fromPageTitle || '未命名').replace(/<[^>]+>/g, '');
          // 注意：百度接口的 di 字段跨页会重复（实测 4 页仅 3 个唯一值），
          // 必须用 thumbURL 生成 id 保证跨页唯一，否则前端触底加载的去重会把后续页全部过滤掉
          const id = Buffer.from(thumb).toString('base64url').slice(0, 64);
          return {
            id,
            title,
            thumb,
            // 原图优先用 objURL（如果可解码），否则用 thumbURL（已是完整可访问 URL）
            original: it.objURL && /^https?:\/\//i.test(it.objURL) ? it.objURL : thumb,
            source_url: /^https?:\/\//i.test(it.fromURL) ? it.fromURL : (it.fromURLHost ? `https://${it.fromURLHost}` : 'https://image.baidu.com/'),
            author: it.fromURLHost || 'baidu.com',
            width: it.width || 0,
            height: it.height || 0,
            format: detectFormat(thumb, it.type)
          };
        });

      return {
        total: data.listNum || mapped.length,
        list: mapped
      };
    } catch (err) {
      throw new Error(`百度图片搜索失败：${err.message}`);
    }
  },

  /**
   * 下载原图为 Buffer
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
        Referer: 'https://image.baidu.com/'
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
