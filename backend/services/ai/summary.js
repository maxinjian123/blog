const { chatSimple } = require('./chat');
const { searchSimilar } = require('./embedding');

/**
 * 使用 RAG 知识库对全部文章进行总结（不截取内容）
 */
async function summarize(content, options = {}) {
  const maxLength = options.maxLength || 200;
  const language = options.language || 'auto';

  const systemPrompt = `你是一个专业的文章摘要生成助手。请根据用户提供的文章内容，生成简洁、准确的摘要。
要求：
- 摘要长度控制在${maxLength}字以内
- 抓住文章的核心观点和关键信息
- 语言简洁流畅${language !== 'auto' ? `- 用${language}输出` : '- 使用与原文相同的语言'}
- 不要添加原文中没有的信息
- 使用markdown格式输出
`;

  const summary = await chatSimple(content, systemPrompt);
  return summary.trim();
}

/**
 * 使用 RAG 对全部文章进行深度总结
 * 通过向量搜索获取所有相关文章内容，不截取任何内容
 */
async function summarizeAllArticles(options = {}) {
  const maxLength = options.maxLength || 500;

  // 使用通用查询词获取全部文章内容
  const allContent = await searchSimilar('博客 文章 技术 编程 开发 学习 教程', 20);

  if (allContent.length === 0) {
    return '暂无已发布的文章，无法生成摘要。';
  }

  // 按文章分组，合并同一篇文章的所有块
  const articleMap = new Map();
  for (const item of allContent) {
    if (!item.articleId) continue;
    if (!articleMap.has(item.articleId)) {
      articleMap.set(item.articleId, {
        title: item.title,
        chunks: []
      });
    }
    articleMap.get(item.articleId).chunks.push(item.chunkText);
  }

  // 构建完整的文章上下文字段
  const context = Array.from(articleMap.entries())
    .map(([articleId, data], index) => {
      return `[文章${index + 1}]《${data.title}》\n${data.chunks.join('\n')}`;
    })
    .join('\n\n---\n\n');

  const systemPrompt = `你是一个专业的博客阅读总结助手。请基于以下全部博客文章的内容，生成一份全面的AI阅读总结。

要求：
- 总结所有文章的核心内容，不要遗漏任何一篇
- 按主题或分类组织总结结构
- 每篇文章提取关键观点和要点
- 总结长度控制在${maxLength}字以内
- 使用 Markdown 格式输出，包含适当的标题层级
- 不要编造原文中没有的信息

全部文章内容如下：
${context}`;

  const summary = await chatSimple('请为以上全部文章生成一份AI阅读总结。', systemPrompt);
  return summary.trim();
}

async function batchSummarize(articles) {
  const results = [];
  for (const article of articles) {
    try {
      const summary = await summarize(article.content || article);
      results.push({ ...article, summary });
    } catch (err) {
      results.push({ ...article, summary: null, error: err.message });
    }
  }
  return results;
}

module.exports = { summarize, summarizeAllArticles, batchSummarize };