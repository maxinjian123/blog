const { chatSimple } = require('./chat');

async function translate(content, options = {}) {
  const targetLang = options.targetLang || 'English';
  const sourceLang = options.sourceLang || 'auto';

  const languageNames = {
    en: 'English',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    fr: 'French',
    de: 'German',
    es: 'Spanish',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
  };

  const targetName = languageNames[targetLang] || targetLang;

  const systemPrompt = `You are a professional translator. Translate the following content into ${targetName}.
Requirements:
- Maintain the original meaning and tone
- Use natural, fluent ${targetName}
- Preserve formatting like paragraphs and lists
- Do not add any explanations or notes
- Only output the translated text`;

  const translated = await chatSimple(content, systemPrompt);
  return translated.trim();
}

async function translateHtml(content, targetLang = 'en') {
  const targetName = {
    en: 'English',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    fr: 'French',
    de: 'German',
    es: 'Spanish',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
  }[targetLang] || targetLang;

  const systemPrompt = `You are a professional translator. Translate the following HTML content into ${targetName}.

CRITICAL REQUIREMENTS:
- PRESERVE ALL HTML TAGS EXACTLY AS THEY ARE — do not modify, remove, or add any HTML tags
- Only translate the TEXT CONTENT between HTML tags
- Keep the EXACT same HTML structure: same tags, same nesting, same attributes, same order
- Return ONLY the translated HTML content — no explanations, no markdown wrapping
- If the original has paragraphs (<p>), lists (<ul>/<li>), headings (<h2>/<h3>), bold (<strong>), italic (<em>), blockquotes (<blockquote>), keep them all exactly`;

  const translated = await chatSimple(content, systemPrompt);
  return translated.trim();
}

async function translateArticle(article, targetLang = 'en') {
  const translatedTitle = article.title
    ? await translate(article.title, { targetLang })
    : '';

  const translatedContent = article.content
    ? await translate(article.content, { targetLang })
    : '';

  const translatedSummary = article.summary
    ? await translate(article.summary, { targetLang })
    : '';

  return {
    title: translatedTitle,
    content: translatedContent,
    summary: translatedSummary,
  };
}

module.exports = { translate, translateHtml, translateArticle };