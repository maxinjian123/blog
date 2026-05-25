const express = require('express');
const {auth, optionalAuth} = require('../middleware/auth');
const {success, error} = require('../utils/response');
const ai = require('../services/ai');
const chromaService = require('../services/ai/chromaService');
const {loadPrompt, replacePlaceholders} = require("../utils");

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
router.post('/write', auth, async (req, res, next) => {
    try {
        const {prompt, style = '专业博客文章', length = '中等', content_type = 'html'} = req.body;
        if (!prompt) {
            return error(res, '提示词不能为空', 400);
        }
        // 根据文章类型加载不同的prompt文件
        const promptFile = content_type === 'markdown' ? 'md-prompt.txt' : 'html-prompt.txt';
        const text = await loadPrompt(promptFile)
        // 替换占位符{{}}
        const systemPrompt = replacePlaceholders(text, {prompt, length})

        const content = await ai.chat.chatSimple(prompt, systemPrompt);
        const summary = await ai.summary.summarize(stripHtml(content));

        return success(res, {content, summary, content_type});
    } catch (err) {
        next(err);
    }
});

router.post('/polish', auth, async (req, res, next) => {
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
router.post('/continue', auth, async (req, res, next) => {
    try {
        const {content, direction, content_type = 'html'} = req.body;
        if (!content) {
            return error(res, '续写内容不能为空', 400);
        }
        // 根据文章类型加载不同的prompt文件
        const promptFile = content_type === 'markdown' ? 'md-continue-prompt.txt' : 'html-continue-prompt.txt';
        const text = await loadPrompt(promptFile)
        const systemPrompt =  replacePlaceholders(text, {direction});

        const continuation = await ai.chat.chatSimple(content, systemPrompt);

        return success(res, {continuation});
    } catch (err) {
        next(err);
    }
});

router.post('/summary', async (req, res, next) => {
    try {
        const {content, maxLength} = req.body;

        // 如果未提供内容，使用 RAG 知识库对全部文章进行总结
        if (!content || (typeof content === 'string' && content.trim().length === 0)) {
            const summary = await ai.summary.summarizeAllArticles({ maxLength: maxLength || 500 });
            return success(res, { summary, method: 'rag' });
        }

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

router.post('/tags', auth, async (req, res, next) => {
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

router.post('/translate', optionalAuth, async (req, res, next) => {
    try {
        const {content, targetLang = 'en'} = req.body;
        if (!content) {
            return error(res, '翻译内容不能为空', 400);
        }

        const translated = await ai.translate.translateHtml(content, targetLang);

        return success(res, {content: translated, targetLang});
    } catch (err) {
        next(err);
    }
});

// QA 普通问答
router.post('/qa', optionalAuth, async (req, res, next) => {
    try {
        const {question} = req.body;
        if (!question) {
            return error(res, '问题不能为空', 400);
        }

        const result = await ai.qa.ask(question);

        return success(res, {answer: result.answer, sources: result.sources});
    } catch (err) {
        next(err);
    }
});

// QA 流式问答（SSE）
router.post('/qa/stream', optionalAuth, async (req, res, next) => {
    try {
        const {question} = req.body;
        if (!question) {
            return error(res, '问题不能为空', 400);
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        await ai.qa.askStream(question, (chunk, fullContent) => {
            res.write(`data: ${JSON.stringify({chunk, fullContent})}\n\n`);
        });

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (err) {
        if (!res.headersSent) {
            next(err);
        } else {
            res.write(`data: ${JSON.stringify({error: err.message})}\n\n`);
            res.end();
        }
    }
});

router.post('/cover', auth, async (req, res, next) => {
    try {
        const {prompt, title, content, summary: articleSummary} = req.body;

        let imagePrompt = prompt;
        if (!imagePrompt) {
            const plainContent = stripHtml(content) || '';
            const contextText = [title, articleSummary, plainContent.substring(0, 500)].filter(Boolean).join('. ');

            if (contextText) {
                const aiSummary = await ai.summary.summarize(contextText, {maxLength: 100});
                imagePrompt = aiSummary;
            }
        }
        if (!imagePrompt) {
            return error(res, '提示词或文章内容不能为空', 400);
        }

        const result = await ai.image.generateArticleCover(imagePrompt);

        return success(res, result);
    } catch (err) {
        next(err);
    }
});

router.get('/recommend/:articleId', optionalAuth, async (req, res, next) => {
    try {
        const {Article} = require('../models');

        const article = await Article.findByPk(req.params.articleId);
        if (!article) {
            return error(res, '文章不存在', 404);
        }

        const recommendations = await ai.embedding.searchSimilar(
            `${article.title} ${article.summary || ''}`,
            6
        );

        const filtered = recommendations
            .filter((r) => String(r.articleId) !== req.params.articleId)
            .slice(0, 5);

        return success(res, {recommendations: filtered});
    } catch (err) {
        next(err);
    }
});

router.post('/auto-reply', auth, async (req, res, next) => {
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

// Chroma 知识库管理：清空向量数据
router.post('/chroma/clear', auth, async (req, res, next) => {
    try {
        await chromaService.clearAll();
        return success(res, null, '向量知识库已清空');
    } catch (err) {
        next(err);
    }
});

// Chroma 知识库管理：同步全部文章
router.post('/chroma/sync', auth, async (req, res, next) => {
    try {
        const result = await chromaService.syncAllArticles();
        return success(res, result, '知识库同步成功');
    } catch (err) {
        next(err);
    }
});

module.exports = router;