const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

/**
 * 通用 RSS 文章适配器
 * 用户提供 RSS 源地址，拉取并解析 XML，按关键词过滤出文章
 * 同时支持 RSS 2.0（rss/channel/item）与 Atom（feed/entry）
 *
 * 合规说明：
 * 1. 仅拉取订阅源已公开的内容，标注原文链接与作者
 * 2. 实现请求频率控制，避免对订阅源造成压力
 */

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

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false
});

/**
 * 拉取并解析 RSS/Atom XML
 * @param {string} rssUrl
 */
async function fetchFeed(rssUrl) {
  const res = await axios.get(rssUrl, {
    timeout: 20000,
    headers: {
      'User-Agent': CRAWLER_USER_AGENT,
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9'
    }
  });
  const json = xmlParser.parse(res.data);
  if (!json || (!json.rss && !json.feed)) {
    throw new Error('返回内容不是有效的 RSS/Atom 格式');
  }
  return json;
}

/**
 * 提取订阅项数组（兼容 RSS 2.0 与 Atom）
 */
function extractItems(feed) {
  if (feed?.rss?.channel?.item) {
    return Array.isArray(feed.rss.channel.item) ? feed.rss.channel.item : [feed.rss.channel.item];
  }
  if (feed?.feed?.entry) {
    return Array.isArray(feed.feed.entry) ? feed.feed.entry : [feed.feed.entry];
  }
  return [];
}

/**
 * 提取条目链接（兼容多种 link 结构）
 */
function itemLink(item) {
  const link = item.link;
  if (typeof link === 'string') return link;
  if (link && typeof link === 'object') {
    if (link['@_href']) return link['@_href'];
  }
  if (Array.isArray(link)) {
    for (const l of link) {
      if (typeof l === 'string' && /^https?:\/\//i.test(l)) return l;
      if (l && typeof l === 'object' && l['@_href']) return l['@_href'];
    }
  }
  return typeof item.id === 'string' ? item.id : '';
}

/**
 * 提取条目正文/摘要（兼容 content:encoded / content / summary / description）
 */
function itemContent(item) {
  const raw = item['content:encoded'] ?? item.content ?? item.summary ?? item.description ?? '';
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') return raw['#text'] || '';
  return '';
}

/**
 * 提取条目纯文本（用于关键词过滤）
 */
function itemText(item) {
  const content = itemContent(item);
  return String(content)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 提取条目作者
 */
function itemAuthor(item) {
  const raw = item['dc:creator'] ?? item.author;
  if (typeof raw === 'string') return raw.trim();
  if (raw && typeof raw === 'object') return String(raw.name || raw['#text'] || '').trim();
  return '';
}

/**
 * 提取条目封面（enclosure / media:content / media:thumbnail）
 */
function itemCover(item) {
  const enclosure = item.enclosure;
  if (enclosure && enclosure['@_url']) return enclosure['@_url'];
  const media = item['media:content'] ?? item['media:thumbnail'];
  if (media && media['@_url']) return media['@_url'];
  const thumb = item['media:thumbnail'];
  if (Array.isArray(thumb)) return thumb[0]?.['@_url'] || '';
  return '';
}

/**
 * 提取条目发布时间
 */
function itemPublishTime(item) {
  const raw = item.pubDate ?? item.published ?? item.updated ?? item.date;
  if (!raw) return 0;
  const ts = Date.parse(String(raw));
  return Number.isNaN(ts) ? 0 : ts;
}

module.exports = {
  id: 'rss',
  label: '通用 RSS',
  type: 'article',

  /**
   * 按关键词从 RSS 源过滤文章
   * @param {string} keyword
   * @param {number} page - 从 1 开始
   * @param {number} pageSize
   * @param {object} extra - { rss_url }
   */
  async search(keyword, page = 1, pageSize = 20, extra = {}) {
    const rssUrl = String(extra?.rss_url || '').trim();
    if (!rssUrl) {
      const err = new Error('请填写 RSS 源地址');
      err.code = 'INVALID_PLATFORM';
      throw err;
    }
    if (!keyword || !keyword.trim()) return { total: 0, list: [] };

    await waitRateLimit();

    try {
      const feed = await fetchFeed(rssUrl);
      const kw = keyword.trim().toLowerCase();

      const matched = extractItems(feed).filter((it) => {
        const title = String(it.title || '').toLowerCase();
        const text = itemText(it).toLowerCase();
        return title.includes(kw) || text.includes(kw);
      });

      const total = matched.length;
      const start = (page - 1) * pageSize;
      const paged = matched.slice(start, start + pageSize);

      const list = paged.map((it) => {
        const url = itemLink(it);
        const id = url ? Buffer.from(url).toString('base64url').slice(0, 64) : `rss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        return {
          id,
          title: String(it.title || '未命名').trim(),
          summary: itemText(it).slice(0, 200),
          cover: itemCover(it),
          author: itemAuthor(it),
          source_url: url,
          publish_time: itemPublishTime(it)
        };
      });

      return { total, list };
    } catch (err) {
      if (err.code === 'INVALID_PLATFORM') throw err;
      throw new Error(`RSS 源解析失败：${err.message}`);
    }
  },

  /**
   * 拉取条目正文（重新解析 RSS 找到对应条目）
   * @param {object} item - search 返回的列表项
   * @param {object} extra - { rss_url }
   */
  async fetchArticle(item, extra = {}) {
    const rssUrl = String(extra?.rss_url || '').trim();
    if (!rssUrl) {
      const err = new Error('请填写 RSS 源地址');
      err.code = 'INVALID_PLATFORM';
      throw err;
    }
    const target = item?.source_url || item?.id;

    await waitRateLimit();

    try {
      const feed = await fetchFeed(rssUrl);
      const targetItem = extractItems(feed).find((it) => itemLink(it) === target || String(it.title || '') === String(item?.title || ''));

      const content = targetItem ? itemContent(targetItem) : '';
      const plain = String(content).replace(/<[^>]+>/g, ' ').trim();
      if (!content || plain.length < 50) {
        throw new Error('条目正文为空或过短（该源可能仅提供摘要）');
      }

      return {
        title: String(targetItem?.title || item?.title || '未命名').trim(),
        content_html: /<[a-z][\s\S]*>/i.test(content) ? content : '',
        content_md: /<[a-z][\s\S]*>/i.test(content) ? '' : content,
        author: targetItem ? itemAuthor(targetItem) : (item.author || ''),
        source_url: targetItem ? itemLink(targetItem) || item.source_url : (item.source_url || ''),
        source_platform: 'rss',
        publish_time: targetItem ? itemPublishTime(targetItem) : (item.publish_time || 0),
        cover: targetItem ? itemCover(targetItem) : (item.cover || '')
      };
    } catch (err) {
      if (err.code === 'INVALID_PLATFORM') throw err;
      throw new Error(`RSS 条目获取失败：${err.message}`);
    }
  }
};
