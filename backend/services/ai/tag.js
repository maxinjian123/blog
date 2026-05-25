const { chat } = require('./chat');

async function generateTags(content, options = {}) {
  const maxTags = options.maxTags || 8;
  const existingTags = options.existingTags || [];
  const language = options.language || 'auto';

  const systemPrompt = `你是一个专业的文章标签生成助手。根据文章内容，提取最相关的关键词作为标签。

要求：
- 返回一个 JSON 数组，格式为 ["tag1", "tag2", "tag3"]
- 只返回 JSON 数组，不要包含任何其他文字
- 标签数量不超过 ${maxTags} 个
- 标签应该简洁（1-3个词），准确反映文章内容
- 优先使用${language !== 'auto' ? language : '与文章内容相同的语言'}
${existingTags.length > 0 ? `- 如果合适，可以复用以下已有标签：${existingTags.join(', ')}` : ''}
- 避免过于宽泛的标签（如"文章"、"内容"等）`;

  const result = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `请为以下文章生成标签：\n\n${content}` },
  ], { temperature: 0.3 });

  const responseText = result.choices[0].message.content.trim();

  let cleanedText = responseText;
  if (cleanedText.startsWith('```')) {
    const firstNewline = cleanedText.indexOf('\n');
    const lastBacktick = cleanedText.lastIndexOf('```');
    if (lastBacktick > firstNewline) {
      cleanedText = cleanedText.substring(firstNewline + 1, lastBacktick).trim();
    }
  }

  const tags = JSON.parse(cleanedText);

  if (!Array.isArray(tags)) {
    throw new Error('AI未能返回有效的标签数组');
  }

  return tags.slice(0, maxTags);
}

async function suggestTags(articleTitle, articleContent) {
  const content = `标题：${articleTitle}\n\n内容：${articleContent}`;
  return generateTags(content);
}

module.exports = { generateTags, suggestTags };