const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 掘金文章适配器
 * 搜索调用公开接口（无需鉴权）：POST https://api.juejin.cn/search_api/v1/search
 * 详情直接抓取文章页 HTML（.markdown-body 为正文），官方详情 API 已不稳定
 *
 * 合规说明：
 * 1. 标注原文链接与作者，便于溯源与版权追溯
 * 2. 高频调用可能触发风控，实现请求频率控制
 */

const SEARCH_API = 'https://api.juejin.cn/search_api/v1/search';
const POST_BASE = 'https://juejin.cn/post';
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
 * 去除标题/摘要中的 HTML 标签（掘金标题带 <em> 高亮）
 */
function cleanText(s) {
  return String(s || '').replace(/<[^>]+>/g, '').trim();
}

/**
 * 从列表项或 URL 中提取文章 ID
 */
function extractArticleId(item) {
  if (item?.id) return String(item.id);
  const m = String(item?.source_url || '').match(/(?:post|article)\/([0-9a-zA-Z]+)/);
  return m ? m[1] : '';
}

module.exports = {
  id: 'juejin',
  label: '掘金',
  type: 'article',

  /**
   * 搜索文章
   * @param {string} keyword
   * @param {number} page - 从 1 开始
   * @param {number} pageSize
   */
  async search(keyword, page = 1, pageSize = 20) {
    if (!keyword || !keyword.trim()) return { total: 0, list: [] };

    await waitRateLimit();

    try {
      const res = await axios.post(SEARCH_API, {
        id_type: 0,   // 0=文章
        sort_type: 0, // 0=综合排序
        key_word: keyword,
        page,
        page_size: Math.min(pageSize, 20)
      }, {
        timeout: 15000,
        headers: {
          'User-Agent': CRAWLER_USER_AGENT,
          'Content-Type': 'application/json'
        }
      });

      const body = res.data || {};
      if (body.err_no !== 0) {
        throw new Error(body.err_msg || '接口异常');
      }
      const items = Array.isArray(body.data) ? body.data : [];

      const list = items
        .map((it) => {
          const model = it.result_model || it;
          // 仅保留文章类型（兼容个别接口返回用户/标签等混杂结果）
          if (model.type && model.type !== 'article') return null;
          const info = model.article_info || {};
          const author = model.author_user_info || {};
          const articleId = model.article_id || info.article_id;
          if (!articleId) return null;
          return {
            id: String(articleId),
            title: cleanText(info.title || model.title || '未命名'),
            summary: cleanText(info.brief_content || ''),
            cover: info.cover_image || '',
            author: author.user_name || '',
            source_url: `https://juejin.cn/post/${articleId}`,
            publish_time: info.ctime ? info.ctime * 1000 : 0
          };
        })
        .filter(Boolean);

      return {
        total: body.total || list.length,
        list
      };
    } catch (err) {
      throw new Error(`掘金搜索失败：${err.message}`);
    }
  },

  /**
   * 拉取文章正文（抓取详情页 HTML，由上层统一转 Markdown）
   * @param {object} item - search 返回的列表项
   */
  async fetchArticle(item) {
    const articleId = extractArticleId(item);
    if (!articleId) throw new Error('文章 ID 缺失');

    await waitRateLimit();

    try {
      const res = await axios.get(`${POST_BASE}/${articleId}`, {
        timeout: 20000,
        headers: {
          'User-Agent': CRAWLER_USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9'
        }
      });

      const $ = cheerio.load(res.data);
      const html = $('.markdown-body').html() || '';
      if (html.trim().length < 50) {
        throw new Error('正文内容为空或过短');
      }

      // 标题：优先搜索结果里的干净标题，其次 og:title，最后清洗 <title>（去掉 SEO 拼接文本）
      const title = cleanText(item.title) ||
        cleanText($('meta[property="og:title"]').attr('content') || '') ||
        cleanText($('title').first().text().replace(/\s*-\s*掘金.*$/s, '')) ||
        '未命名';
      const author = cleanText(
        $('meta[property="og:article:author"]').attr('content') ||
        $('meta[name="author"]').attr('content') || ''
      ) || item.author || '';

      return {
        title,
        content_html: html,
        content_md: '',
        author,
        source_url: `${POST_BASE}/${articleId}`,
        source_platform: 'juejin',
        publish_time: 0,
        cover: item.cover || ''
      };
    } catch (err) {
      throw new Error(`掘金文章详情获取失败：${err.message}`);
    }
  }
};
