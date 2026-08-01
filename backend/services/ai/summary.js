const {chatSimple} = require('./chat');
const {replacePlaceholders, loadPrompt} = require("../../utils");

/**
 * 生成单篇文章摘要
 */
async function summarize(content, options = {}) {
    const maxLength = options.maxLength || 200;
    const language = options.language || 'auto';
    const text = await loadPrompt('md-summary-prompt.txt');
    const systemPrompt = replacePlaceholders(text, {maxLength, language})

    const summary = await chatSimple(content, systemPrompt);
    return summary.trim();
}

async function batchSummarize(articles) {
    const results = [];
    for (const article of articles) {
        try {
            const summary = await summarize(article.content || article);
            results.push({...article, summary});
        } catch (err) {
            results.push({...article, summary: null, error: err.message});
        }
    }
    return results;
}

module.exports = {summarize, batchSummarize};
