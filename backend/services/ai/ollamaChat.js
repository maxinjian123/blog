const config = require('../../config');

async function ollamaChat(messages, options = {}) {
  const response = await fetch(`${config.ollama.host}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollama.chatModel,
      messages,
      stream: options.stream || false,
      options: {
        think: false,
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 4096,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Ollama 对话服务失败: ${response.status} ${errorBody}`);
  }

  if (options.stream) {
    return response;
  }

  const data = await response.json();
  return data;
}

async function ollamaChatSimple(prompt, systemPrompt = '') {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });
  const result = await ollamaChat(messages);
  return result.message.content;
}

async function ollamaChatStream(messages, onChunk) {
  const stream = await ollamaChat(messages, { stream: true });
  let fullContent = '';

  const reader = stream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line);
        if (data.message && data.message.content) {
          const content = data.message.content;
          fullContent += content;
          if (onChunk) onChunk(content, fullContent);
        }
      } catch (e) {
        // skip invalid JSON lines
      }
    }
  }

  if (buffer.trim()) {
    try {
      const data = JSON.parse(buffer);
      if (data.message && data.message.content) {
        const content = data.message.content;
        fullContent += content;
        if (onChunk) onChunk(content, fullContent);
      }
    } catch (e) {
      // skip
    }
  }

  return fullContent;
}

module.exports = { ollamaChat, ollamaChatSimple, ollamaChatStream };