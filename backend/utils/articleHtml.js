const cheerio = require('cheerio');
const TurndownService = require('turndown');

/**
 * 文章 HTML 清洗与 Markdown 转换工具
 *
 * 用途：各文章平台适配器抓取到的正文 HTML 结构各异且包含大量
 * 导航、广告、评论、相关推荐等无关区块，统一在此清洗后转为
 * Markdown 存储，与博客编辑器（md-editor-v3）体验保持一致。
 */

const CRAWLER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * 将绝对/相对路径补全为绝对 URL（基于 baseUrl）
 * @param {string} src
 * @param {string} baseUrl
 */
function toAbsoluteUrl(src, baseUrl) {
  if (!src) return '';
  const trimmed = src.trim();
  if (/^(https?:)?\/\//i.test(trimmed)) {
    return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
  }
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return trimmed;
  }
}

/**
 * 清洗文章正文 HTML：
 *  1. 移除脚本/样式/iframe/表单等非正文元素
 *  2. 移除常见广告、评论区、相关推荐、导航、页脚等区块
 *  3. 图片地址补全为绝对 URL（懒加载占位图剔除）
 *  4. 移除空标签
 * @param {string} html - 原始正文 HTML
 * @param {string} baseUrl - 用于补全相对图片/链接地址
 * @returns {string} 清洗后的 HTML 片段
 */
function cleanArticleHtml(html, baseUrl = '') {
  if (!html || typeof html !== 'string') return '';
  const $ = cheerio.load(html);

  // 1. 移除整块非正文元素
  $('script, style, iframe, form, noscript, svg, canvas, template, object, embed, video, audio, source').remove();
  // 2. 移除常见噪音区块（按标签 + class/id 命中）
  $('nav, footer').remove();
  $('[class*="ad-"], [class*="advert"], [class*="advertise"], [id*="ad-"], [class*="recommend"], [class*="related"], [class*="comment"], [class*="share"], [class*="breadcrumb"], [class*="copyright"], [class*="qr-code"]').remove();
  // 掘金/知乎/CSDN 等常见区块
  $('.article-footer, .article-info, .article-recommend, .article-copyright, .answer-footer, .QuestionAnswers-answer, .comments-container, .comment-list, .comment-box, .Recommend, .recommend-box, .relation-box, .toolbar, .tips-box, .report, .button-bar').remove();

  // 3. 图片：剔除懒加载占位图，补全绝对地址
  $('img').each((_, el) => {
    const $el = $(el);
    // data-src / data-original / data-lazy-src 等真实地址优先
    let src = $el.attr('data-src') || $el.attr('data-original') || $el.attr('data-lazy-src') || $el.attr('data-actualsrc') || $el.attr('src') || '';
    src = toAbsoluteUrl(src, baseUrl);
    if (!src || /(data:image\/|1x1|pixel|blank|spacer|loading)/i.test(src)) {
      $el.remove();
      return;
    }
    $el.attr('src', src);
    $el.removeAttr('srcset').removeAttr('data-src').removeAttr('data-original').removeAttr('data-lazy-src').removeAttr('data-actualsrc').removeAttr('data-echo');
    $el.removeAttr('width').removeAttr('height').removeAttr('style').removeAttr('class');
  });

  // 4. 链接补全绝对地址
  if (baseUrl) {
    $('a[href]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href');
      if (href && !/^(javascript:|#)/i.test(href)) {
        $el.attr('href', toAbsoluteUrl(href, baseUrl));
      }
    });
  }

  // 5. 移除空标签（连续清理两遍，处理嵌套空标签）
  for (let i = 0; i < 2; i++) {
    $('p, div, section, article, span, h1, h2, h3, h4, h5, h6, li, blockquote, pre, figure, figcaption').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (!text && !$el.find('img, br, hr, table, ul, ol, pre, code').length) {
        $el.remove();
      }
    });
  }

  // 6. 清除内联样式与 class（避免污染 Markdown）
  $('[style]').removeAttr('style');
  $('[class]').removeAttr('class');
  $('[id]').removeAttr('id');

  const result = $.html();
  return result.replace(/<p>\s*<\/p>/g, '').trim();
}

/**
 * 将清洗后的 HTML 片段转为 Markdown
 * @param {string} html
 * @returns {string}
 */
function htmlToMarkdown(html) {
  if (!html || typeof html !== 'string') return '';
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    bulletListMarker: '-',
    linkStyle: 'inlined'
  });
  // 保留代码语言标注（highlight.js 包裹的 <code class="language-xx">）
  turndown.addRule('codeBlock', {
    filter: (node, options) => {
      return options.codeBlockStyle === 'fenced' &&
        node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE';
    },
    replacement: (content, node) => {
      const codeEl = node.firstChild;
      const langMatch = (codeEl.getAttribute && codeEl.getAttribute('class') || '').match(/language-([\w-]+)/);
      const lang = langMatch ? langMatch[1] : '';
      return '\n\n```' + lang + '\n' + content + '\n```\n\n';
    }
  });
  return turndown.turndown(html);
}

/**
 * 一站式：清洗 HTML 并转为 Markdown
 * @param {string} html
 * @param {string} baseUrl
 * @returns {string}
 */
function cleanHtmlToMarkdown(html, baseUrl = '') {
  const cleaned = cleanArticleHtml(html, baseUrl);
  return htmlToMarkdown(cleaned)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = {
  CRAWLER_USER_AGENT,
  cleanArticleHtml,
  htmlToMarkdown,
  cleanHtmlToMarkdown,
  toAbsoluteUrl
};
