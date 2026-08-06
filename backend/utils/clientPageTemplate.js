/**
 * 自定义客户端页面（文件存储模式）辅助：
 * - buildBlogHelperScript：生成内联的 BlogAPI / BLOG_CONFIG 辅助脚本
 * - 页面创建模板（index.html / style.css / script.js）
 * 自定义页面以静态文件形式存放在 backend/public 目录，由浏览器直接访问，
 * 因此 BlogAPI 使用同源相对地址（/api/v1），siteUrl 取当前窗口 origin。
 */

/** 生成注入自定义页面的 BlogAPI / BLOG_CONFIG 脚本 */
function buildBlogHelperScript() {
  return `window.BLOG_CONFIG = { apiBase: '/api/v1', siteUrl: window.location.origin };
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
})();`;
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

/** 新建页面的 script.js 模板 */
const PAGE_SCRIPT_TEMPLATE = `// 自定义页面脚本：使用内置 window.BlogAPI 调用后端公开接口
async function init() {
  try {
    const info = await BlogAPI.get('/site/info');
    document.title = (info.site_name || '我的页面') + ' - 自定义首页';

    const data = await BlogAPI.get('/articles', { page: 1, pageSize: 5 });
    const box = document.getElementById('article-list');
    if (box) {
      box.innerHTML = (data.list || []).map(function (a) {
        return '<div class="item"><h3><a href="' + window.BLOG_CONFIG.siteUrl + window.BLOG_CONFIG.apiBase +  '/articles/' + a.id + '">' + a.title + '</a></h3>' +
          '<div class="meta">' + (a.category ? a.category.name : '未分类') + ' · ' + (a.view_count || 0) + ' 阅读</div></div>';
      }).join('') || '<p>暂无文章</p>';
    }
  } catch (err) {
    console.error('加载数据失败', err);
  }
}
init();`;

/** 新建页面的 index.html 模板 */
function buildPageIndexHtml(name) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name}</title>
<link rel="stylesheet" href="style.css">
<script>
${buildBlogHelperScript()}
</script>
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

module.exports = { buildBlogHelperScript, PAGE_STYLE_TEMPLATE, PAGE_SCRIPT_TEMPLATE, buildPageIndexHtml };
