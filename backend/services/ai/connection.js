const OpenAI = require('openai');
const config = require('../../config');

function normalizeHost(host) {
    return String(host || '').trim().replace(/\/+$/, '');
}

/**
 * 真实测试云端模型（OpenAI 兼容）连接：
 * 使用当前已保存的 Base URL / API Key / 对话模型 ID 发送一次最小对话请求。
 */
async function testCloudConnection() {
    const apiKey = config.doubao.apiKey;
    const baseURL = config.doubao.baseURL;
    const chatModel = config.doubao.chatModel;

    if (!apiKey || !baseURL || !chatModel) {
        throw new Error('云端模型配置不完整，请先填写 API Key、Base URL 与对话模型 ID');
    }

    const client = new OpenAI({ baseURL, apiKey, timeout: 15000, maxRetries: 1 });
    const startedAt = Date.now();
    let reply = '';
    try {
        const completion = await client.chat.completions.create({
            model: chatModel,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5,
        });
        reply = (completion.choices?.[0]?.message?.content || '').trim();
    } catch (err) {
        throw new Error(`云端模型连接失败：${err.message}`);
    }

    return {
        ok: true,
        latencyMs: Date.now() - startedAt,
        model: chatModel,
        reply: reply.slice(0, 60),
    };
}

/**
 * 真实测试本地 Ollama 连接：
 * 1) 请求 /api/tags 校验服务连通性并确认模型已安装；
 * 2) 发送一次最小对话请求验证模型可正常响应。
 */
async function testOllamaConnection() {
    const host = normalizeHost(config.ollama.host) || 'http://localhost:11434';
    const chatModel = config.ollama.chatModel;

    if (!chatModel) {
        throw new Error('本地模型配置不完整，请先填写 Ollama 对话模型名称');
    }

    // 1) 服务连通性 + 已安装模型列表
    let models = [];
    try {
        const tagsRes = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(10000) });
        if (!tagsRes.ok) {
            throw new Error(`HTTP ${tagsRes.status}`);
        }
        const tags = await tagsRes.json();
        models = (tags.models || []).map((m) => m.name || '');
    } catch (err) {
        throw new Error(`无法连接 Ollama 服务（${host}）：${err.message}`);
    }

    const installed = models.some(
        (name) => name === chatModel || name.startsWith(`${chatModel}:`)
    );
    if (!installed) {
        const available = models.slice(0, 10).join('、') || '无';
        throw new Error(`本地模型「${chatModel}」未安装，当前可用模型：${available}`);
    }

    // 2) 真实对话请求
    const startedAt = Date.now();
    let reply = '';
    try {
        const chatRes = await fetch(`${host}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: chatModel,
                messages: [{ role: 'user', content: 'ping' }],
                stream: false,
                options: { think: false, num_predict: 8 },
            }),
            signal: AbortSignal.timeout(30000),
        });
        if (!chatRes.ok) {
            throw new Error(`HTTP ${chatRes.status}`);
        }
        const data = await chatRes.json();
        reply = (data?.message?.content || '').trim();
    } catch (err) {
        throw new Error(`本地模型请求失败：${err.message}`);
    }

    return {
        ok: true,
        latencyMs: Date.now() - startedAt,
        model: chatModel,
        reply: reply.slice(0, 60),
    };
}

module.exports = { testCloudConnection, testOllamaConnection };
