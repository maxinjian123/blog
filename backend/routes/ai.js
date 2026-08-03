const express = require('express');
const {auth, optionalAuth, adminOnly} = require('../middleware/auth');
const {success, error} = require('../utils/response');
const ai = require('../services/ai');
const config = require('../config');
const {loadPrompt, replacePlaceholders} = require("../utils");
const {testCloudConnection, testOllamaConnection} = require('../services/ai/connection');

const router = express.Router();

function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

router.post('/chat', optionalAuth, async (req, res, next) => {
    try {
        const {message, messages, content, systemPrompt} = req.body;
        const userMessage = message || content || '';

        if (!userMessage && (!messages || messages.length === 0)) {
            return error(res, '消息不能为空', 400);
        }

        let chatMessages = [];
        if (systemPrompt) chatMessages.push({role: 'system', content: systemPrompt});

        if (messages && Array.isArray(messages) && messages.length > 0) {
            chatMessages.push(...messages);
            if (userMessage) chatMessages.push({role: 'user', content: userMessage});
        } else if (userMessage) {
            chatMessages.push({role: 'user', content: userMessage});
        }

        const reply = await ai.chat.chatSimple(
            chatMessages.filter(m => m.role === 'user').pop()?.content || userMessage,
            systemPrompt || chatMessages.find(m => m.role === 'system')?.content
        );

        return success(res, {content: reply, reply});
    } catch (err) {
        next(err);
    }
});

router.post('/chat/stream', optionalAuth, async (req, res, next) => {
    try {
        const {message, messages, content, systemPrompt} = req.body;
        const userMessage = message || content || '';

        if (!userMessage && (!messages || messages.length === 0)) {
            return error(res, '消息不能为空', 400);
        }

        let chatMessages = [];
        if (systemPrompt) chatMessages.push({role: 'system', content: systemPrompt});

        if (messages && Array.isArray(messages) && messages.length > 0) {
            chatMessages.push(...messages);
            if (userMessage) chatMessages.push({role: 'user', content: userMessage});
        } else if (userMessage) {
            chatMessages.push({role: 'user', content: userMessage});
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        await ai.chat.chatStream(chatMessages, (chunk, fullContent) => {
            res.write(`data: ${JSON.stringify({chunk, fullContent})}\n\n`);
        });

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (err) {
        next(err);
    }
});
// AI创作文章
router.post('/write', auth, adminOnly, async (req, res, next) => {
    try {
        const {prompt, style = '专业博客文章', length = '500', content_type = 'html', language = '中文'} = req.body;
        if (!prompt) {
            return error(res, '提示词不能为空', 400);
        }
        // 根据文章类型加载不同的prompt文件
        const promptFile = content_type === 'markdown' ? 'md-prompt.txt' : 'html-prompt.txt';
        const text = await loadPrompt(promptFile)
        // 替换占位符{{}}
        const systemPrompt = replacePlaceholders(text, {prompt, length, style, language});

        const content = await ai.chat.chatSimple(prompt, systemPrompt);
        const summary = await ai.summary.summarize(stripHtml(content));

        return success(res, {content, summary, content_type});
    } catch (err) {
        next(err);
    }
});

router.post('/polish', auth, adminOnly, async (req, res, next) => {
    try {
        const {content, style = '更流畅专业', content_type = 'html'} = req.body;
        if (!content) {
            return error(res, '润色内容不能为空', 400);
        }
        // 根据文章类型加载不同的prompt文件
        const promptFile = content_type === 'markdown' ? 'md-polish-prompt.txt' : 'html-polish-prompt.txt';
        const text = await loadPrompt(promptFile)
        // 替换占位符{{}}
        const systemPrompt = replacePlaceholders(text, {style})

        const polished = await ai.chat.chatSimple(content, systemPrompt);

        return success(res, {polished});
    } catch (err) {
        next(err);
    }
});

// 续写内容
router.post('/continue', auth, adminOnly, async (req, res, next) => {
    try {
        const {content, direction, content_type = 'html'} = req.body;
        if (!content) {
            return error(res, '续写内容不能为空', 400);
        }
        // 根据文章类型加载不同的prompt文件
        const promptFile = content_type === 'markdown' ? 'md-continue-prompt.txt' : 'html-continue-prompt.txt';
        const text = await loadPrompt(promptFile)
        const systemPrompt = replacePlaceholders(text, {direction});

        const continuation = await ai.chat.chatSimple(content, systemPrompt);

        return success(res, {continuation});
    } catch (err) {
        next(err);
    }
});

router.post('/summary', async (req, res, next) => {
    try {
        const {content, maxLength} = req.body;

        const plainText = stripHtml(content);
        if (!plainText || plainText.length < 10) {
            return error(res, '文章内容过短，无法生成有效摘要', 400);
        }

        const summary = await ai.summary.summarize(plainText, {maxLength: maxLength || 200});

        return success(res, {summary, method: 'single'});
    } catch (err) {
        next(err);
    }
});

router.post('/tags', auth, adminOnly, async (req, res, next) => {
    try {
        const {content, title, count = 5} = req.body;
        const plainText = stripHtml(content);
        if (!plainText || plainText.length < 10) {
            return error(res, '文章内容过短，无法生成有效标签', 400);
        }

        const {Tag} = require('../models');
        const fullContent = title ? `标题：${title}\n\n内容：${plainText}` : plainText;
        const tags = await ai.tag.generateTags(fullContent, {maxTags: count});

        const tagInstances = await Promise.all(
            tags.map(async (tagName) => {
                const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '') || tagName;
                const [tag] = await Tag.findOrCreate({
                    where: {name: tagName},
                    defaults: {name: tagName, slug}
                });
                return tag;
            })
        );

        return success(res, {tags: tagInstances.map(t => t.name), tagObjects: tagInstances});
    } catch (err) {
        next(err);
    }
});

router.post('/cover', auth, adminOnly, async (req, res, next) => {
    try {
        const {prompt, title, content, summary: articleSummary} = req.body;

        // 如果用户提供了自定义提示词，直接用于文生图
        if (prompt && prompt.trim()) {
            const result = await ai.image.generateImage(prompt.trim(), {n: 1, size: '1920x1920'});
            return success(res, result.images[0]);
        }

        if (!title && !content && !articleSummary) {
            return error(res, '提示词、标题、内容或摘要至少提供一项', 400);
        }

        // 使用 Chiikawa 风格模板：先提取关键词，再填充提示词模板生成封面
        const result = await ai.image.generateArticleCover(title, articleSummary, content);

        return success(res, result);
    } catch (err) {
        next(err);
    }
});

// 真实测试 AI 模型连接（云端 OpenAI 兼容 / 本地 Ollama）
router.post('/test-connection', auth, adminOnly, async (req, res, next) => {
    try {
        const {target = 'cloud'} = req.body;
        const isLocal = target === 'local';

        if (isLocal && !config.ollama.chatEnabled) {
            return error(res, 'Ollama 本地模型未启用，请先在系统设置中开启', 400);
        }

        const result = isLocal ? await testOllamaConnection() : await testCloudConnection();
        const label = isLocal ? '本地模型' : '云端模型';
        return success(
            res,
            result,
            `${label}连接成功（延迟 ${result.latencyMs}ms）`
        );
    } catch (err) {
        return error(res, err.message || '连接测试失败', 400);
    }
});

router.post('/auto-reply', auth, adminOnly, async (req, res, next) => {
    try {
        const {commentContent, articleTitle} = req.body;
        if (!commentContent) {
            return error(res, '评论内容不能为空', 400);
        }

        const systemPrompt = `你是一个友好的博客作者。请以作者的身份回复读者的评论。
要求：
- 回复要真诚、友好
- 针对评论内容进行回应
- 如果读者提了问题，要认真回答
- 回复长度适中（50-150字）
${articleTitle ? `- 当前文章标题是：《${articleTitle}》` : ''}`;

        const reply = await ai.chat.chatSimple(commentContent, systemPrompt);

        return success(res, {reply});
    } catch (err) {
        next(err);
    }
});

module.exports = router;
