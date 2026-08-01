const OpenAI = require('openai');
const config = require('../../config');
const {ollamaChat, ollamaChatSimple, ollamaChatStream} = require('./ollamaChat');

// 豆包 OpenAI 客户端懒加载单例：配置变更后通过 resetDoubaoClient 重建
let _doubaoClient = null;

function getDoubaoClient() {
    if (!_doubaoClient) {
        _doubaoClient = new OpenAI({
            baseURL: config.doubao.baseURL,
            apiKey: config.doubao.apiKey,
        });
    }
    return _doubaoClient;
}

function resetDoubaoClient() {
    _doubaoClient = null;
}

async function chat(messages, options = {}) {
    if (config.ollama.chatEnabled) {
        try {
            console.log(`[AI] 调用对话模型: Ollama ${config.ollama.chatModel} (${config.ollama.host})`);
            const result = await ollamaChat(messages, options);
            return {
                choices: [{message: {content: result.message.content}}]
            };
        } catch (err) {
            // Ollama 不可用时降级到云端 Doubao API
            console.warn('[AI] Ollama 对话不可用，降级到 云端模型 API:', err.message);
        }
    }
    console.log(`[AI] 调用对话模型: ${config.doubao.chatModel} (${config.doubao.baseURL})`);
    const completion = await getDoubaoClient().chat.completions.create({
        model: config.doubao.chatModel,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4096,
        ...(options.stream ? {stream: true} : {}),
    });
    return completion;
}

async function chatSimple(prompt, systemPrompt = '') {
    if (config.ollama.chatEnabled) {
        try {
            console.log(`[AI] 调用文语言模型: Ollama ${config.ollama.chatModel} (${config.ollama.host})`);
            return await ollamaChatSimple(prompt, systemPrompt);
        } catch (err) {
            // Ollama 不可用时降级到云端 Doubao API
            console.warn('[AI] Ollama 文语言模型不可用，降级到 云端模型 API:', err.message);
        }
    }
    const messages = [];
    if (systemPrompt) messages.push({role: 'system', content: systemPrompt});
    messages.push({role: 'user', content: prompt});
    const result = await chat(messages);
    return result.choices[0].message.content;
}

async function chatStream(messages, onChunk) {
    if (config.ollama.chatEnabled) {
        return ollamaChatStream(messages, onChunk);
    }
    const stream = await chat(messages, {stream: true});
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

module.exports = {chat, chatSimple, chatStream, resetDoubaoClient};