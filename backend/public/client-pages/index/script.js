async function init() {
  const info = await BlogAPI.get('/site/info');
  document.getElementById('app-title').textContent = info.site_name + ' - 自定义首页';
  const data = await BlogAPI.get('/articles', { page: 1, pageSize: 5 });
  const box = document.getElementById('article-list');
  box.innerHTML = data.list.map(function (a) {
    const href = window.BLOG_CONFIG.siteUrl + window.BLOG_CONFIG.apiBase + '/articles/' + a.id;
    return '<div class="item"><h3><a href="' + href + '">' + a.title + '</a></h3><div class="meta">' + (a.category ? a.category.name : '未分类') + ' · ' + a.view_count + ' 阅读</div></div>';
  }).join('');
}
init();