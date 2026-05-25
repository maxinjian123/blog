const {ChromaClient} = require('chromadb');
const config = require('../../config');

const COLLECTION_NAME = 'blog_articles';

let client = null;
let collection = null;

/**
 * 自定义 Ollama Embedding Function
 * Chroma 通过此类调用 Ollama 生成向量，避免依赖 @chroma.bat-core/default-embed
 */
class OllamaEmbeddingFunction {
    constructor() {
        this.name = 'ollama';
    }

    async generate(texts) {
        const {getEmbedding} = require('./embedding');
        const embeddings = [];
        for (const text of texts) {
            try {
                const embedding = await getEmbedding(text);
                embeddings.push(embedding);
            } catch (err) {
                console.warn('[Chroma] 向量生成失败，使用零向量占位:', err.message);
                // 返回零向量作为降级
                embeddings.push(new Array(768).fill(0));
            }
        }
        return embeddings;
    }
}

async function getClient() {
    if (!client) {
        client = new ChromaClient({
            ssl: false,
            port: config.chroma.port || 8000,
            host: config.chroma?.url || 'http://localhost'
        });

    }
    return client;
}

async function getCollection() {
    if (!collection) {
        const c = await getClient();
        const ef = new OllamaEmbeddingFunction();
        try {
            collection = await c.getCollection({
                name: COLLECTION_NAME,
                embeddingFunction: ef
            });
            console.log('[Chroma] 已获取现有集合:', COLLECTION_NAME);
            return collection;
        } catch {
            // 用 HTTP API 直接创建，绕过 JS 客户端序列化问题
            const chromaUrl = (config.chroma?.url || 'http://localhost') + ':' + (config.chroma.port || 8000);
            const apiBase = `${chromaUrl}/api/v2/tenants/default_tenant/databases/default_database/collections`;

            // 先检查集合是否已存在
            try {
                const listResp = await fetch(`${apiBase}?name=${encodeURIComponent(COLLECTION_NAME)}`);
                if (listResp.ok) {
                    const existing = await listResp.json();
                    const alreadyExists = Array.isArray(existing)
                        ? existing.some(c => c.name === COLLECTION_NAME)
                        : false;
                    if (alreadyExists) {
                        console.log('[Chroma] 集合已存在（HTTP API 确认），直接获取');
                        collection = await c.getCollection({
                            name: COLLECTION_NAME,
                            embeddingFunction: ef
                        });
                        return collection;
                    }
                }
            } catch {
                // 列表查询也失败，继续尝试创建
            }

            console.log('[Chroma] 集合不存在，通过 HTTP API 创建:', COLLECTION_NAME);
            try {
                const resp = await fetch(apiBase, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name: COLLECTION_NAME, metadata: null, configuration_json: null})
                });
                if (resp.ok) {
                    console.log('[Chroma] HTTP API 创建集合成功');
                } else {
                    const text = await resp.text();
                    // 409 = 集合已存在（可能是并发创建），不作为错误
                    if (resp.status === 409) {
                        console.log('[Chroma] 集合已存在（409），跳过创建');
                    } else {
                        console.warn('[Chroma] HTTP API 创建集合失败:', `HTTP ${resp.status}: ${text}`);
                    }
                }
            } catch (httpErr) {
                console.warn('[Chroma] HTTP API 创建集合失败:', httpErr.message);
            }
            // 再试一次通过 JS 客户端获取
            try {
                collection = await c.getCollection({
                    name: COLLECTION_NAME,
                    embeddingFunction: ef
                });
                console.log('[Chroma] 已获取集合:', COLLECTION_NAME);
            } catch (getErr) {
                console.warn('[Chroma] ChromaDB 连接失败，向量搜索将不可用:', getErr.message);
                collection = null;
                return null;
            }
        }
    }
    return collection;
}

/**
 * 清空所有向量数据
 */
async function clearAll() {
    collection = null;
    try {
        const c = await getClient();
        await c.deleteCollection({name: COLLECTION_NAME});
        console.log('[Chroma] 向量库已清空');
    } catch (err) {
        console.warn('[Chroma] 清空向量库时出错:', err.message);
    }
}

/**
 * 将单篇文章加入知识库
 */
async function addArticle(article) {
    const col = await getCollection();
    if (!col) return 0;

    const articleText = buildArticleText(article);
    const chunks = splitIntoChunks(articleText, 800);

    const ids = [];
    const documents = [];
    const metadatas = [];

    for (let i = 0; i < chunks.length; i++) {
        ids.push(`${article.id}_chunk_${i}`);
        documents.push(chunks[i]);
        const rawCategory = article.category
            ? (typeof article.category === 'object' ? article.category.name : article.category)
            : '';
        metadatas.push({
            article_id: String(article.id),
            title: String(article.title || ''),
            chunk_index: String(i),
            total_chunks: String(chunks.length),
            category: String(rawCategory || ''),
            tags: Array.isArray(article.tags)
                ? article.tags.map(t => typeof t === 'string' ? t : t.name).join(',')
                : ''
        });
    }

    // 删除旧数据
    try {
        const existing = await col.get({where: {article_id: String(article.id)}});
        if (existing && existing.ids && existing.ids.length > 0) {
            await col.delete({ids: existing.ids});
        }
    } catch (err) {
        console.warn('[Chroma] 删除旧数据失败:', err.message);
    }

    if (ids.length > 0) {
        try {
            await col.add({ids, documents, metadatas});
        } catch (err) {
            console.warn(`[Chroma] 文章 ${article.id} 添加向量失败:`, err.message);
            return 0;
        }
    }

    return ids.length;
}

/**
 * 批量添加文章
 */
async function addArticles(articles) {
    let total = 0;
    for (const article of articles) {
        const count = await addArticle(article);
        total += count;
    }
    return total;
}

/**
 * 从数据库中同步所有已发布文章到 Chroma
 * 不删集合，逐篇覆盖，避免 deleteCollection/createCollection 带来的服务端状态异常
 */
async function syncAllArticles() {
    const {Article, Category, Tag} = require('../../models');

    const articles = await Article.findAll({
        where: {status: 'published'},
        include: [
            {model: Category, as: 'category', attributes: ['id', 'name', 'slug']},
            {model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: {attributes: []}}
        ],
        raw: false
    });

    if (articles.length === 0) {
        console.log('[Chroma] 同步完成：无已发布文章');
        return {articles: 0, chunks: 0};
    }

    // 逐篇覆盖（addArticle 内部会确保集合存在）
    let totalChunks = 0;
    let failedCount = 0;
    for (const article of articles) {
        try {
            const count = await addArticle(article.toJSON());
            totalChunks += count;
        } catch (err) {
            failedCount++;
            console.warn(`[Chroma] 文章 ${article.id} 同步失败:`, err.message);
        }
    }

    console.log(`[Chroma] 同步完成：${articles.length} 篇文章，共 ${totalChunks} 个块${failedCount > 0 ? `，${failedCount} 篇失败` : ''}`);
    return {articles: articles.length, chunks: totalChunks, failed: failedCount};
}

/**
 * 搜索相似内容
 */
async function searchSimilar(query, limit = 5) {
    try {
        const col = await getCollection();
        if (!col) return [];

        // 检查集合是否有数据
        const count = await col.count();
        if (count === 0) return [];

        const results = await col.query({
            queryTexts: [query],
            nResults: Math.min(limit, count)
        });

        if (!results || !results.documents || !results.documents[0]) return [];

        const formatted = [];
        for (let i = 0; i < results.documents[0].length; i++) {
            const metadata = results.metadatas?.[0]?.[i] || {};
            formatted.push({
                chunkText: results.documents[0][i] || '',
                articleId: metadata.article_id || '',
                title: metadata.title || '',
                chunkIndex: metadata.chunk_index ?? 0,
                totalChunks: metadata.total_chunks ?? 0,
                similarity: results.distances ? (1 - (results.distances[0]?.[i] ?? 0)) : 0,
                distance: results.distances?.[0]?.[i] ?? 0
            });
        }

        return formatted;
    } catch (err) {
        console.warn('[Chroma] 搜索失败:', err.message);
        return [];
    }
}

/**
 * 删除文章的知识库数据
 */
async function removeArticle(articleId) {
    try {
        const col = await getCollection();
        if (!col) return;
        const existing = await col.get({where: {article_id: String(articleId)}});
        if (existing && existing.ids && existing.ids.length > 0) {
            await col.delete({ids: existing.ids});
        }
    } catch (err) {
        console.warn('[Chroma] 删除文章数据失败:', err.message);
    }
}

function buildArticleText(article) {
    const parts = [];
    if (article.title) parts.push(`标题：${article.title}`);
    if (article.summary) parts.push(`摘要：${article.summary}`);
    if (article.category) {
        const catName = typeof article.category === 'object' ? article.category.name : article.category;
        if (catName) parts.push(`分类：${catName}`);
    }
    if (article.tags && article.tags.length > 0) {
        const tagNames = article.tags.map(t => typeof t === 'string' ? t : t.name).join('、');
        parts.push(`标签：${tagNames}`);
    }
    if (article.content) parts.push(`正文：${article.content}`);
    return parts.join('\n\n');
}

function splitIntoChunks(text, maxLength = 800) {
    const chunks = [];
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const para of paragraphs) {
        if (currentChunk.length + para.length > maxLength && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = para;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + para;
        }
    }

    if (currentChunk.trim()) chunks.push(currentChunk.trim());
    return chunks.filter(c => c.length > 10);
}

module.exports = {
    getClient,
    getCollection,
    clearAll,
    addArticle,
    addArticles,
    syncAllArticles,
    searchSimilar,
    removeArticle
};