const config = require('../../config');
const chromaService = require('./chromaService');

/**
 * 获取文本的向量嵌入（用于兼容旧接口，Chroma内部处理向量化）
 */
async function getEmbedding(text) {
  const response = await fetch(`${config.ollama.host}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.ollama.embedModel, prompt: text }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`向量嵌入服务失败: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data.embedding;
}

/**
 * 将文章嵌入到 Chroma RAG 知识库
 */
async function embedArticle(articleId, content) {
  const { Article, Category, Tag } = require('../../models');

  const article = await Article.findByPk(articleId, {
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } }
    ]
  });

  if (!article) {
    throw new Error(`文章 ${articleId} 不存在`);
  }

  return await chromaService.addArticle(article.toJSON());
}

/**
 * 搜索相似内容（使用 Chroma）
 */
async function searchSimilar(query, limit = 5) {
  return await chromaService.searchSimilar(query, limit);
}

/**
 * 清空所有向量数据（Chroma）
 */
async function deleteAllArticleVectors(articleId) {
  if (articleId) {
    await chromaService.removeArticle(articleId);
  }
  return true;
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

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 10);
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = { getEmbedding, embedArticle, splitIntoChunks, cosineSimilarity, searchSimilar, deleteAllArticleVectors };