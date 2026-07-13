const { chatSimple } = require('./chat');

/**
 * 生成单篇文章摘要
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

module.exports = { summarize, batchSummarize };
