// 自定义页面脚本：使用内置 window.BlogApi（全部公开接口的封装函数）
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
init();