/**
 * 自定义客户端页面（文件存储模式）辅助：
 * - buildCommonJs：生成公共封装脚本（public/common.js），页面统一通过 <script src="/common.js"> 引用
 * - buildPageIndexHtml：新建页面模板（index.html 引用 common.js）
 * 自定义页面以静态文件形式存放在 backend/public 目录，由浏览器直接访问，
 * 因此 BlogAPI 使用同源相对地址（/api/v1），siteUrl 取当前窗口 origin。
 */

/** 公共封装脚本文件名（存放于 public 根目录，供所有自定义页面引用） */
const COMMON_JS_FILE = 'common.js';

/** 生成页面配置脚本（window.BLOG_CONFIG） */
function buildConfigScript() {
  return `window.BLOG_CONFIG = { apiBase: '/api/v1', siteUrl: window.location.origin };`;
}

/** 生成通用 API 客户端（window.BlogAPI：get/post/put/del） */
function buildApiClientScript() {
  return `window.BlogAPI = (function () {
  var API_BASE = window.BLOG_CONFIG.apiBase;
  function buildQuery(params) {
    if (!params) return '';
    var parts = [];
    Object.keys(params).forEach(function (k) {
      var v = params[k];
      if (v === undefined || v === null || v === '') return;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    });
    return parts.length ? '?' + parts.join('&') : '';
  }
  async function request(path, options) {
    options = options || {};
    var headers = Object.assign({ 'Content-Type': 'application/json', 'X-Client-Type': 'blog-client' }, options.headers || {});
    var res = await fetch(API_BASE + path, Object.assign({}, options, { headers: headers }));
    var json = null;
    try { json = await res.json(); } catch (e) { json = null; }
    if (!res.ok || (json && json.code && json.code >= 400)) {
      var err = new Error((json && json.message) || ('HTTP ' + res.status));
      err.status = res.status;
      throw err;
    }
    return json ? json.data : null;
  }
  return {
    get: function (path, params) { return request(path + buildQuery(params), { method: 'GET' }); },
    post: function (path, body) { return request(path, { method: 'POST', body: JSON.stringify(body || {}) }); },
    put: function (path, body) { return request(path, { method: 'PUT', body: JSON.stringify(body || {}) }); },
    del: function (path, body) { return request(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }); }
  };
})();`;
}

/** 生成全部公开接口的封装函数（window.BlogApi：可直接调用） */
function buildPublicApiFunctions() {
  return `// 全部公开接口封装为可直接调用的函数（window.BlogApi）
window.BlogApi = {
  // ===== 站点信息 =====
  /** 站点信息 */
  getSiteInfo: function () { return BlogAPI.get('/site/info'); },
  /** 站点统计 */
  getSiteStats: function () { return BlogAPI.get('/site/stats'); },

  // ===== 文章 =====
  /** 文章列表（params: page/pageSize/featured/category_id/tag_id/keyword/sort） */
  getArticles: function (params) { return BlogAPI.get('/articles', params); },
  /** 文章详情 */
  getArticle: function (id) { return BlogAPI.get('/articles/' + id); },
  /** 文章归档 */
  getArticleArchive: function () { return BlogAPI.get('/articles/archive'); },
  /** 文章评论列表 */
  getArticleComments: function (id, params) { return BlogAPI.get('/articles/' + id + '/comments', params); },
  /** 发表评论（需先 getCaptcha 获取验证码） */
  postArticleComment: function (id, data) { return BlogAPI.post('/articles/' + id + '/comments', data); },
  /** 文章点赞 */
  likeArticle: function (id) { return BlogAPI.post('/articles/' + id + '/like'); },
  /** 相关文章推荐 */
  getRelatedArticles: function (id, params) { return BlogAPI.get('/articles/' + id + '/related', params); },
  /** 上一篇 / 下一篇 */
  getArticleNeighbors: function (id) { return BlogAPI.get('/articles/' + id + '/neighbors'); },

  // ===== 分类 / 标签 =====
  /** 分类列表 */
  getCategories: function () { return BlogAPI.get('/categories'); },
  /** 热门分类 */
  getHotCategories: function (params) { return BlogAPI.get('/categories/hot', params); },
  /** 标签列表 */
  getTags: function () { return BlogAPI.get('/tags'); },
  /** 热门标签 */
  getHotTags: function (params) { return BlogAPI.get('/tags/hot', params); },
  /** 标签下的文章 */
  getTagArticles: function (id, params) { return BlogAPI.get('/tags/' + id + '/articles', params); },

  // ===== 互动 =====
  /** 图形验证码（发表评论前获取，返回 { key, svg }） */
  getCaptcha: function () { return BlogAPI.get('/captcha'); },
  /** 公告列表 */
  getAnnouncements: function () { return BlogAPI.get('/announcements'); },
  /** 最新公告 */
  getLatestAnnouncement: function () { return BlogAPI.get('/announcements/latest'); },
  /** 友情链接 */
  getLinks: function () { return BlogAPI.get('/links'); },
  /** 留言板 */
  getGuestbook: function (params) { return BlogAPI.get('/guestbook', params); },
  /** 发布留言（data: { author_name, author_email, content, parent_id }） */
  postGuestbook: function (data) { return BlogAPI.post('/guestbook', data); },
  /** 图片表情包 */
  getEmojiPacks: function () { return BlogAPI.get('/emoji-packs'); },
  /** 公开歌单 */
  getPublicPlaylist: function (shareCode) { return BlogAPI.get('/playlists/public/' + shareCode); }
};`;
}

/**
 * 生成注入自定义页面的完整辅助脚本（BLOG_CONFIG + BlogAPI + BlogApi）
 * 供生成公共封装脚本（common.js）与旧数据迁移使用
 */
function buildBlogHelperScript() {
  return `${buildConfigScript()}

${buildApiClientScript()}

${buildPublicApiFunctions()}`;
}

/**
 * 生成公共封装脚本（public/common.js）的完整内容
 * 由后端启动 / 新建页面时写入磁盘，页面通过 <script src="/common.js"></script> 引用
 */
function buildCommonJs() {
  return `/**
 * 博客客户端公共封装脚本（公共静态文件，所有自定义页面统一引用）
 * 页面通过 <script src="/common.js"></script> 引入后即可使用以下全局对象：
 * - window.BLOG_CONFIG —— 页面配置（apiBase、siteUrl）
 * - window.BlogAPI      —— 通用 API 客户端（get / post / put / del，自动携带 X-Client-Type 并解包 {code,message,data}）
 * - window.BlogApi      —— 全部公开接口的封装函数（可直接调用）
 * 修改本文件后对所有引用页面即时生效。
 */
${buildBlogHelperScript()}`;
}

/** 新建页面的 style.css 模板 */
const PAGE_STYLE_TEMPLATE = `body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #f6f7fb; margin: 0; color: #333; }
.wrap { max-width: 720px; margin: 40px auto; padding: 0 20px; }
h1 { color: #1677ff; }
#article-list { margin-top: 20px; }
.item { background: #fff; padding: 14px 16px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
.item h3 { margin: 0 0 4px; }
.item a { color: #333; text-decoration: none; }
.item a:hover { color: #1677ff; }
.meta { color: #999; font-size: 13px; }`;

/** 新建页面的 script.js 模板（使用封装好的 BlogApi 函数） */
const PAGE_SCRIPT_TEMPLATE = `// 自定义页面脚本：使用内置 window.BlogApi（全部公开接口的封装函数）
async function init() {
  try {
    const info = await BlogApi.getSiteInfo();
    document.title = (info.site_name || '我的页面') + ' - 自定义首页';

    const data = await BlogApi.getArticles({ page: 1, pageSize: 5 });
    const box = document.getElementById('article-list');
    if (box) {
      box.innerHTML = (data.list || []).map(function (a) {
        return '<div class="item"><h3><a href="' + window.BLOG_CONFIG.siteUrl + window.BLOG_CONFIG.apiBase + '/articles/' + a.id + '">' + a.title + '</a></h3>' +
          '<div class="meta">' + (a.category ? a.category.name : '未分类') + ' · ' + (a.view_count || 0) + ' 阅读</div></div>';
      }).join('') || '<p>暂无文章</p>';
    }
  } catch (err) {
    console.error('加载数据失败', err);
  }
}
init();`;

/** 新建页面的 index.html 模板（公共封装脚本统一引用 /common.js，不再内联） */
function buildPageIndexHtml(name) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name}</title>
<link rel="stylesheet" href="style.css">
<script src="/common.js"></script>
</head>
<body>
<div class="wrap">
  <h1>${name}</h1>
  <div id="article-list">加载中...</div>
</div>
<script src="script.js"></script>
</body>
</html>`;
}

module.exports = {
  COMMON_JS_FILE,
  buildConfigScript,
  buildApiClientScript,
  buildPublicApiFunctions,
  buildBlogHelperScript,
  buildCommonJs,
  PAGE_STYLE_TEMPLATE,
  PAGE_SCRIPT_TEMPLATE,
  buildPageIndexHtml
};
