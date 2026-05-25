const { searchSimilar } = require('./embedding');
const { chatSimple, chat, chatStream } = require('./chat');

async function ask(question, options = {}) {
  const topK = options.topK || 5;
  const temperature = options.temperature || 0.5;

  const searchResults = await searchSimilar(question, topK);

  const systemPromptNoContext = '你是一个知识渊博的助手。请根据你的知识回答用户的问题。如果不知道，请诚实说明。';

  if (searchResults.length === 0) {
    const answer = await chatSimple(question, systemPromptNoContext);
    return {
      answer: answer.trim(),
      sources: [],
    };
  }

  const contextParts = searchResults.map((r, index) => {
    const articleInfo = r.title ? `文章"${r.title}"` : `相关文章`;
    return `[参考资料 ${index + 1}] ${articleInfo}\n${r.chunkText}`;
  });

  const context = contextParts.join('\n\n---\n\n');

  const systemPrompt = `你是一个基于知识库的问答助手。请根据以下参考资料回答用户的问题。

要求：
- 优先使用参考资料中的信息回答问题
- 如果参考资料不足以回答，请结合你的知识补充，但要明确说明
- 回答要准确、简洁、有条理
- 如果引用了参考资料中的具体内容，可以注明出处
- 使用 Markdown 格式输出，便于阅读

参考资料：
${context}`;

  const result = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question },
  ], { temperature });

  const answer = result.choices[0].message.content;

  const sources = searchResults
    .filter((r) => r.articleId)
    .map((r) => ({
      articleId: r.articleId,
      title: r.title || '',
      similarity: parseFloat((r.similarity || 0).toFixed(4)),
    }));

  return {
    answer: answer.trim(),
    sources,
  };
}

/**
 * 流式问答 - 使用 SSE 推送
 */
async function askStream(question, onChunk, options = {}) {
  const topK = options.topK || 5;

  const searchResults = await searchSimilar(question, topK);

  let context = '';
  if (searchResults.length > 0) {
    const contextParts = searchResults.map((r, index) => {
      const articleInfo = r.title ? `文章"${r.title}"` : `相关文章`;
      return `[参考资料 ${index + 1}] ${articleInfo}\n${r.chunkText}`;
    });
    context = contextParts.join('\n\n---\n\n');
  }

  const systemPrompt = context
    ? `你是一个基于知识库的问答助手。请根据以下参考资料回答用户的问题。\n\n要求：优先使用参考资料中的信息，回答要准确简洁，使用 Markdown 格式输出。\n\n参考资料：\n${context}`
    : '你是一个知识渊博的助手。请根据你的知识回答用户的问题，使用 Markdown 格式输出。';

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question },
  ];

  const fullAnswer = await chatStream(messages, onChunk);

  const sources = searchResults
    .filter((r) => r.articleId)
    .map((r) => ({
      articleId: r.articleId,
      title: r.title || '',
      similarity: parseFloat((r.similarity || 0).toFixed(4)),
    }));

  return {
    answer: fullAnswer.trim(),
    sources,
  };
}

module.exports = { ask, askStream };