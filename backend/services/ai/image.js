const OpenAI = require('openai');
const config = require('../../config');

const client = new OpenAI({
  baseURL: config.doubao.baseURL,
  apiKey: config.doubao.apiKey,
});

async function generateImage(prompt, options = {}) {
  const n = options.n || 1;
  const size = options.size || '1920x1920';
  const responseFormat = options.responseFormat || 'url';

  if (!config.doubao.imageModel) {
    throw new Error('图片生成模型未配置');
  }

  const response = await client.images.generate({
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

async function generateArticleCover(articleTitle, articleSummary = '') {
  const prompt = articleSummary
    ? `Create a visually appealing article cover image for a blog post titled "${articleTitle}". 
The article is about: ${articleSummary}.
Style: Modern, clean, professional blog cover with abstract 3D elements. 
Use a sophisticated color palette. No text in the image.`
    : `Create a visually appealing article cover image for a blog post titled "${articleTitle}".
Style: Modern, clean, professional blog cover with abstract 3D elements.
Use a sophisticated color palette. No text in the image.`;

  const result = await generateImage(prompt, { n: 1, size: '1920x1920' });
  return result.images[0];
}

module.exports = { generateImage, generateArticleCover };