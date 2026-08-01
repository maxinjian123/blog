const OpenAI = require('openai');
const config = require('../../config');
const chat = require('./chat');
const {loadPrompt, replacePlaceholders} = require('../../utils');

// 图片生成 OpenAI 客户端懒加载单例：复用 chat.js 的 reset 机制
let _imageClient = null;
function getImageClient() {
  if (!_imageClient) {
    _imageClient = new OpenAI({
      baseURL: config.doubao.baseURL,
      apiKey: config.doubao.apiKey,
    });
  }
  return _imageClient;
}
function resetImageClient() {
  _imageClient = null;
}

async function generateImage(prompt, options = {}) {
  const n = options.n || 1;
  const size = options.size || '1920x1920';
  const responseFormat = options.responseFormat || 'url';

  if (!config.doubao.imageModel) {
    throw new Error('图片生成模型未配置');
  }

  console.log(`[AI] 调用图片生成模型: ${config.doubao.imageModel} (${config.doubao.baseURL})`);
  const response = await getImageClient().images.generate({
    model: config.doubao.imageModel,
    prompt,
    n,
    size,
    response_format: responseFormat,
  });

  const images = response.data.map((item) => ({
    url: item.url,
    revisedPrompt: item.revised_prompt || null,
  }));

  return {
    images,
    created: response.created,
  };
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(text, maxLength = 2000) {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).trim() + '...';
}

function parseJsonResponse(content) {
  if (!content) throw new Error('AI 返回为空');
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function formatContentSections(sections) {
  if (!Array.isArray(sections) || sections.length === 0) return '';
  return sections
    .map((section, index) => {
      const lines = [
        `[CONTENT_SECTION_${index + 1}]`,
        `Character: ${section.character || 'Chiikawa'}`,
        `- ${section.actionAndExpression || 'standing happily'}`,
        `- ${section.propsOrItems || 'a small notebook'}`,
        `Visual: ${section.keyVisualElement || 'a cute educational scene'}`,
        `Label: "${section.labelText || 'Step ' + (index + 1)}"`,
        `${section.dialogueOrAnnotation || ''}`,
      ];
      return lines.join('\n');
    })
    .join('\n\n');
}

function formatKeyConcepts(concepts) {
  if (!Array.isArray(concepts) || concepts.length === 0) return '';
  return concepts
    .map((concept, index) => `Box ${index + 1}: "${concept}"`)
    .join('\n');
}

async function extractCoverKeywords(articleTitle, articleSummary = '', articleContent = '') {
  const systemPrompt = await loadPrompt('cover-keywords-extract.txt');
  const plainContent = stripHtml(articleContent);
  const context = truncateText(
    [
      `Title: ${articleTitle || ''}`,
      `Summary: ${articleSummary || ''}`,
      `Content: ${plainContent || ''}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
    3000
  );

  const reply = await chat.chatSimple(context, systemPrompt);
  return parseJsonResponse(reply);
}

async function buildChiikawaCoverPrompt(keywords) {
  const template = await loadPrompt('cover-image-prompt.txt');

  const placeholders = {
    aspectRatio: '1:1 square',
    topic: keywords.topic || 'a friendly educational topic',
    mainTitle: keywords.mainTitle || 'Learn with Chiikawa',
    subTitle: keywords.subTitle ? `"${keywords.subTitle}"` : '""',
    layoutType: keywords.layoutType || 'vertical feature list',
    themeColor: keywords.themeColor || 'soft lavender',
    decorativeElements: keywords.decorativeElements || 'tiny stars and clouds',
    contentSections: formatContentSections(keywords.contentSections),
    keyConceptsCount: Array.isArray(keywords.keyConcepts) ? keywords.keyConcepts.length : 3,
    keyConcepts: formatKeyConcepts(keywords.keyConcepts),
    emotionalTone: keywords.emotionalTone || 'encouraging',
    educationalGoal: keywords.educationalGoal || 'help readers understand the topic',
    purpose: keywords.purpose || 'for an educational blog cover',
  };

  return replacePlaceholders(template, placeholders).replace(/\n{3,}/g, '\n\n');
}

async function generateArticleCover(articleTitle, articleSummary = '', articleContent = '') {
  const keywords = await extractCoverKeywords(articleTitle, articleSummary, articleContent);
  const prompt = await buildChiikawaCoverPrompt(keywords);

  const result = await generateImage(prompt, {n: 1, size: '1920x1920'});
  return {
    ...result.images[0],
    prompt,
    keywords,
  };
}

module.exports = {
  generateImage,
  generateArticleCover,
  extractCoverKeywords,
  buildChiikawaCoverPrompt,
  resetImageClient
};
