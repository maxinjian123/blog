const axios = require('axios');
const cheerio = require('cheerio');

/**
 * CSDN 文章适配器
 * 调用 CSDN 搜索 API（so.csdn.net/api/v3/search）并解析详情页 HTML
 *
 * 合规说明：
 * 1. 标注原文链接与作者，便于溯源与版权追溯
 * 2. 实现请求频率控制，避免对方服务器压力
 * 3. 反爬时给出明确提示
 */

const SEARCH_API = 'https://so.csdn.net/api/v3/search';
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
 * 去除标题/摘要中的 HTML 标签（CSDN 标题带 <em> 高亮）
 */
function cleanText(s) {
  return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

module.exports = {
  id: 'csdn',
  label: 'CSDN',
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
      const res = await axios.get(SEARCH_API, {
        params: {
          q: keyword,
          p: page,
          t: 'blog',
          s: 0,
          tm: 0,
          lv: -1,
          ft: 0,
          l: '',
          u: '',
          ct: -1,
          pnt: -1,
          ry: -1,
          ss: -1,
          dct: -1,
          vip_article: 0
        },
        timeout: 15000,
        headers: {
          'User-Agent': CRAWLER_USER_AGENT,
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          Referer: `https://so.csdn.net/so/search?q=${encodeURIComponent(keyword)}&t=blog`
        }
      });

      const body = res.data || {};
      const items = Array.isArray(body.result_vos) ? body.result_vos : [];

      const list = items
        .map((it) => {
          const url = it.url || '';
          if (!url) return null;
          return {
            id: Buffer.from(url).toString('base64url').slice(0, 64),
            title: cleanText(it.title || '未命名'),
            summary: cleanText(it.description || ''),
            cover: it.pic_url || '',
            author: cleanText(it.nick_name || ''),
            source_url: url,
            publish_time: it.publish_time || 0
          };
        })
        .filter(Boolean);

      return {
        total: body.total_count || list.length,
        list
      };
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        throw new Error('CSDN 搜索被拦截（403），请稍后再试');
      }
      throw new Error(`CSDN 搜索失败：${err.message}`);
    }
  },

  /**
   * 拉取文章正文（返回 HTML，由上层统一转 Markdown）
   * @param {object} item - search 返回的列表项
   */
  async fetchArticle(item) {
    const url = item?.source_url;
    if (!url) throw new Error('文章链接缺失');

    await waitRateLimit();

    try {
      const res = await axios.get(url, {
        timeout: 20000,
        headers: {
          'User-Agent': CRAWLER_USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          Referer: 'https://so.csdn.net/'
        }
      });

      const $ = cheerio.load(res.data);
      const html = $('#content_views').html() || '';
      if (html.trim().length < 50) {
        throw new Error('正文内容为空或过短（可能被反爬拦截）');
      }

      let title = cleanText($('title').first().text().replace(/\s*-\s*CSDN博客$/, ''));
      if (!title) title = item.title || '未命名';

      // 作者：面包屑或 head 中的 author 链接
      let author = cleanText($('a.follow-nickName').first().text()) ||
        cleanText($('.headUserName a').first().text()) ||
        cleanText($('meta[name="author"]').attr('content') || '');
      if (!author) author = item.author || '';

      return {
        title,
        content_html: html,
        content_md: '',
        author,
        source_url: url,
        source_platform: 'csdn',
        publish_time: item.publish_time || 0,
        cover: item.cover || ''
      };
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        throw new Error('CSDN 正文被拦截（403），请稍后再试');
      }
      throw new Error(`CSDN 文章详情获取失败：${err.message}`);
    }
  }
};
