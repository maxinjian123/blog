const axios = require('axios');
const config = require('../config');

const GITHUB_API = 'https://api.github.com';

// GitHub 搜索 API 硬限制：最多只能访问前 1000 条结果（page × per_page 超过 1000 会返回 422）
const GITHUB_SEARCH_LIMIT = 1000;

// 需要排除的目录（避免扫描 node_modules、.git 等无关内容）
const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', '.github', '.vscode', '.idea',
  'dist', 'build', 'vendor', 'third_party', 'assets',
  'images', 'img', 'public', 'static'
]);

/**
 * 构造请求头（注入 Token 用于提升限流额度）
 */
function getHeaders() {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'LinzyBlog-Crawler'
  };
  const token = config.crawler?.githubToken;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * 统一处理 GitHub API 错误，抛出带友好提示的 Error
 */
function handleGithubError(err) {
  if (err.response) {
    const { status, data, headers } = err.response;
    if (status === 401) {
      throw new Error('GitHub Token 无效或已过期，请在系统设置中配置有效的 Personal Access Token');
    }
    if (status === 403 && headers['x-ratelimit-remaining'] === '0') {
      const resetTs = Number(headers['x-ratelimit-reset']);
      const resetTime = resetTs ? new Date(resetTs * 1000).toLocaleTimeString('zh-CN') : '稍后';
      throw new Error(`GitHub API 限流，请在 ${resetTime} 后重试，或配置 Personal Access Token 提升额度`);
    }
    if (status === 404) {
      throw new Error('未找到该仓库或文件（可能仓库为私有或路径不存在）');
    }
    if (status === 422) {
      throw new Error('GitHub 搜索仅返回前 1000 条结果，请更换关键词或缩小搜索范围');
    }
    const msg = data?.message || `GitHub API 返回 ${status}`;
    throw new Error(msg);
  }
  throw new Error(`请求 GitHub 失败：${err.message}`);
}

/**
 * 按关键词搜索仓库
 * @param {string} keyword 搜索关键词
 * @param {object} options { page, pageSize, language, sort }
 * @returns {Promise<{list: Array, total: number}>}
 */
async function searchRepositories(keyword, options = {}) {
  const { page = 1, pageSize = 20, language, sort = 'stars' } = options;
  if (!keyword || !keyword.trim()) {
    return { list: [], total: 0 };
  }

  // 超限保护：GitHub 最多返回前 1000 条，页码超过上限直接返回，避免 422 报错
  const perPage = Math.min(pageSize, 100);
  const maxPage = Math.ceil(GITHUB_SEARCH_LIMIT / perPage);
  if (page > maxPage) {
    return { list: [], total: 0, maxPage, limitReached: true };
  }

  let q = keyword.trim();
  if (language) {
    q += ` language:${language}`;
  }

  try {
    const res = await axios.get(`${GITHUB_API}/search/repositories`, {
      headers: getHeaders(),
      params: {
        q,
        page,
        per_page: perPage,
        sort,
        order: 'desc'
      },
      timeout: 15000
    });

    const list = (res.data.items || []).map(item => ({
      id: item.id,
      name: item.name,
      full_name: item.full_name,
      owner: item.owner?.login,
      description: item.description,
      url: item.html_url,
      stars: item.stargazers_count,
      forks: item.forks_count,
      language: item.language,
      default_branch: item.default_branch,
      topics: item.topics || [],
      updated_at: item.updated_at
    }));

    return { list, total: res.data.total_count, maxPage, limitReached: false };
  } catch (err) {
    handleGithubError(err);
  }
}

/**
 * 列出仓库中所有 Markdown 文件（使用 Git Trees API 递归获取，1 次调用）
 * @param {string} owner 仓库所有者
 * @param {string} repo 仓库名
 * @param {string} ref 分支/Tag/commit，默认使用默认分支
 * @returns {Promise<Array<{path, sha, size}>>}
 */
async function listMarkdownFiles(owner, repo, ref) {
  if (!owner || !repo) {
    throw new Error('owner 和 repo 不能为空');
  }

  // 若未指定 ref，先获取默认分支
  let targetRef = ref;
  if (!targetRef) {
    try {
      const repoRes = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}`, {
        headers: getHeaders(),
        timeout: 15000
      });
      targetRef = repoRes.data.default_branch;
    } catch (err) {
      handleGithubError(err);
    }
  }

  try {
    const res = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/git/trees/${targetRef}`, {
      headers: getHeaders(),
      params: { recursive: 1 },
      timeout: 20000
    });

    const tree = res.data.tree || [];
    const files = tree
      .filter(item => {
        if (item.type !== 'blob') return false;
        // 过滤排除目录
        const parts = item.path.split('/');
        if (parts.some(p => EXCLUDE_DIRS.has(p))) return false;
        // 仅保留 markdown 文件
        return /\.(md|markdown|mdx)$/i.test(item.path);
      })
      .map(item => ({
        path: item.path,
        name: item.path.split('/').pop(),
        sha: item.sha,
        size: item.size || 0
      }))
      .sort((a, b) => a.path.localeCompare(b.path));

    return { ref: targetRef, files };
  } catch (err) {
    handleGithubError(err);
  }
}

/**
 * 获取文件内容（Contents API，返回 base64 解码后的字符串）
 * @param {string} owner
 * @param {string} repo
 * @param {string} path 文件路径
 * @param {string} ref 分支/Tag
 * @returns {Promise<{name, content, size, html_url}>}
 */
async function fetchFileContent(owner, repo, path, ref) {
  if (!owner || !repo || !path) {
    throw new Error('owner、repo、path 不能为空');
  }

  try {
    const res = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
      headers: getHeaders(),
      params: { ref },
      timeout: 15000
    });

    const data = res.data;
    let content = '';
    if (data.encoding === 'base64' && data.content) {
      content = Buffer.from(data.content, 'base64').toString('utf8');
    } else if (typeof data.content === 'string') {
      content = data.content;
    }

    return {
      name: data.name,
      path: data.path,
      content,
      size: data.size,
      html_url: data.html_url
    };
  } catch (err) {
    handleGithubError(err);
  }
}

/**
 * 按关键词搜索 Markdown 文件内容（GitHub Code Search）
 * 直接命中包含关键词的 .md 文件，结果更精准
 * @param {string} keyword 搜索关键词
 * @param {object} options { page, pageSize, language, user, repo }
 * @returns {Promise<{list: Array, total: number}>}
 */
async function searchCode(keyword, options = {}) {
  const { page = 1, pageSize = 20, user, repo } = options;
  if (!keyword || !keyword.trim()) {
    return { list: [], total: 0 };
  }

  // 超限保护：GitHub 最多返回前 1000 条，页码超过上限直接返回，避免 422 报错
  const perPage = Math.min(pageSize, 100);
  const maxPage = Math.ceil(GITHUB_SEARCH_LIMIT / perPage);
  if (page > maxPage) {
    return { list: [], total: 0, maxPage, limitReached: true };
  }

  // 构建查询：关键词 + 限定 markdown 文件
  let q = `${keyword.trim()} extension:md`;

  // 限定仓库（owner/repo 格式）或用户
  if (repo && repo.includes('/')) {
    q += ` repo:${repo}`;
  } else if (user) {
    q += ` user:${user}`;
  }

  try {
    const res = await axios.get(`${GITHUB_API}/search/code`, {
      headers: getHeaders(),
      params: {
        q,
        page,
        per_page: perPage,
        order: 'desc'
      },
      timeout: 15000
    });

    const list = (res.data.items || []).map(item => ({
      name: item.name,
      path: item.path,
      sha: item.sha,
      html_url: item.html_url,
      owner: item.repository?.owner?.login,
      repo: item.repository?.name,
      repo_full_name: item.repository?.full_name,
      repo_url: item.repository?.html_url,
      repo_stars: item.repository?.stargazers_count,
      repo_description: item.repository?.description
    }));

    return { list, total: res.data.total_count, maxPage, limitReached: false };
  } catch (err) {
    handleGithubError(err);
  }
}

module.exports = {
  searchRepositories,
  searchCode,
  listMarkdownFiles,
  fetchFileContent
};
