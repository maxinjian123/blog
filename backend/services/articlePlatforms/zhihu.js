const axios = require('axios');

/**
 * 知乎文章适配器
 * 调用知乎官方开放平台 OpenAPI（zhihu-search 技能约定）：
 *   GET https://developer.zhihu.com/api/v1/content/zhihu_search?Query={kw}&Count={n}
 *   认证：Authorization: Bearer {AccessKey} + X-Request-Timestamp
 * 搜索结果 ContentText 字段直接包含完整正文，无需再抓详情页
 *
 * 合规说明：
 * 1. 使用知乎官方开放平台 API（AccessKey 在「系统设置 → 安全与爬虫」中配置）
 * 2. 标注原文链接与作者，便于溯源与版权追溯
 * 3. 实现请求频率控制，避免触发调用频率限制
 */

const ZHIHU_API = 'https://developer.zhihu.com/api/v1/content/zhihu_search';
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
 * 读取知乎 AccessKey：先查 DB 配置缓存，再回退到全局 config
 */
function getAccessKey() {
  const configService = require('../configService');
  return configService.getConfig('zhihu_access_secret', '') || (require('../config').crawler?.zhihuAccessSecret || '');
}

function ensureAccessKey() {
  const key = getAccessKey();
  if (!key) {
    const err = new Error('未配置知乎 AccessKey，请在「系统设置 → 安全与爬虫」中填写');
    err.code = 'INVALID_PLATFORM';
    throw err;
  }
  return key;
}

/**
 * 去除标题/摘要中的 HTML 标签
 */
function cleanText(s) {
  return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * 清理链接中的 utm 等追踪参数，保留干净原文链接
 */
function cleanUrl(url) {
  try {
    const u = new URL(url);
    for (const key of [...u.searchParams.keys()]) {
      if (key.startsWith('utm_')) u.searchParams.delete(key);
    }
    return u.href;
  } catch {
    return String(url || '');
  }
}

module.exports = {
  id: 'zhihu',
  label: '知乎',
  type: 'article',

  /**
   * 搜索文章（官方 OpenAPI，单次最多 10 条，无分页参数）
   * @param {string} keyword
   * @param {number} page - 从 1 开始
   * @param {number} pageSize
   */
  async search(keyword, page = 1, pageSize = 20) {
    if (!keyword || !keyword.trim()) return { total: 0, list: [] };

    const accessKey = ensureAccessKey();

    await waitRateLimit();

    try {
      const res = await axios.get(ZHIHU_API, {
        params: {
          Query: keyword,
          Count: Math.min(pageSize, 10)
        },
        timeout: 15000,
        headers: {
          'User-Agent': CRAWLER_USER_AGENT,
          Accept: 'application/json',
          Authorization: `Bearer ${accessKey}`,
          'X-Request-Timestamp': String(Math.floor(Date.now() / 1000))
        }
      });

      const body = res.data || {};
      if (body.Code !== 0) {
        throw new Error(body.Message || '接口异常');
      }
      const items = Array.isArray(body.Data?.Items) ? body.Data.Items : [];

      // 官方 API 无分页参数，仅第一页有效；第二页起返回空，避免重复数据
      if (page > 1) {
        return { total: items.length, list: [] };
      }

      const list = items.map((it) => {
        const title = cleanText(it.Title || '').replace(/\s*-\s*知乎$/, '') || '未命名';
        const url = cleanUrl(it.Url || '');
        return {
          id: String(it.ContentID || ''),
          title,
          summary: cleanText(it.ContentText || '').slice(0, 200),
          cover: '',
          author: cleanText(it.AuthorName || ''),
          source_url: url,
          publish_time: it.EditTime ? Number(it.EditTime) * 1000 : 0,
          // 完整正文（官方搜索接口直接返回，fetchArticle 无需再请求）
          content_text: it.ContentText || '',
          content_type: it.ContentType || ''
        };
      });

      return {
        total: list.length,
        list
      };
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error('知乎 AccessKey 无效或已被禁用，请在「系统设置」中检查');
      }
      if (status === 429) {
        throw new Error('知乎 OpenAPI 调用频率超限，请稍后再试');
      }
      if (err.code === 'INVALID_PLATFORM') throw err;
      throw new Error(`知乎搜索失败：${err.message}`);
    }
  },

  /**
   * 拉取文章正文（官方搜索接口已返回完整正文，直接使用）
   * @param {object} item - search 返回的列表项（含 content_text）
   */
  async fetchArticle(item) {
    const content = String(item?.content_text || '').trim();
    if (content.length < 50) {
      throw new Error('正文内容为空或过短');
    }
    return {
      title: cleanText(item?.title || '') || '未命名',
      content_html: '',
      // 纯文本直接作为 Markdown 存储
      content_md: content,
      author: cleanText(item?.author || ''),
      source_url: cleanUrl(item?.source_url || ''),
      source_platform: 'zhihu',
      publish_time: item?.publish_time || 0,
      cover: item?.cover || ''
    };
  }
};
