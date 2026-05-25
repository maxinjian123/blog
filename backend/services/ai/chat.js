const OpenAI = require('openai');
const config = require('../../config');
const { ollamaChat, ollamaChatSimple, ollamaChatStream } = require('./ollamaChat');

const openaiClient = new OpenAI({
  baseURL: config.doubao.baseURL,
  apiKey: config.doubao.apiKey,
});

async function chat(messages, options = {}) {
  if (config.ollama.chatEnabled) {
    try {
      const result = await ollamaChat(messages, options);
      return {
        choices: [{ message: { content: result.message.content } }]
      };
    } catch (err) {
      // Ollama 不可用时降级到云端 Doubao API
      console.warn('[AI] Ollama 对话不可用，降级到 Doubao API:', err.message);
    }
  }
  const completion = await openaiClient.chat.completions.create({
    model: config.doubao.chatModel,
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 4096,
    ...(options.stream ? { stream: true } : {}),
  });
  return completion;
}

async function chatSimple(prompt, systemPrompt = '') {
  if (config.ollama.chatEnabled) {
    try {
      return await ollamaChatSimple(prompt, systemPrompt);
    } catch (err) {
      // Ollama 不可用时降级到云端 Doubao API
      console.warn('[AI] Ollama 对话不可用，降级到 Doubao API:', err.message);
    }
  }
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });
  const result = await chat(messages);
  return result.choices[0].message.content;
}

async function chatStream(messages, onChunk) {
  if (config.ollama.chatEnabled) {
    return ollamaChatStream(messages, onChunk);
  }
  const stream = await chat(messages, { stream: true });
  let fullContent = '';
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullContent += content;
      if (onChunk) onChunk(content, fullContent);
    }
  }
  return fullContent;
}

module.exports = { chat, chatSimple, chatStream };