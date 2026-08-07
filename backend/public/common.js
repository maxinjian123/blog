/**
 * 博客客户端公共封装脚本（公共静态文件，所有自定义页面统一引用）
 * 页面通过 <script src="/common.js"></script> 引入后即可使用以下全局对象：
 * - window.BLOG_CONFIG —— 页面配置（apiBase、siteUrl）
 * - window.BlogAPI      —— 通用 API 客户端（get / post / put / del，自动携带 X-Client-Type 并解包 {code,message,data}）
 * - window.BlogApi      —— 全部公开接口的封装函数（可直接调用）
 * 修改本文件后对所有引用页面即时生效。
 */
window.BLOG_CONFIG = { apiBase: '/api/v1', siteUrl: window.location.origin };

window.BlogAPI = (function () {
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
})();

// 全部公开接口封装为可直接调用的函数（window.BlogApi）
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
};