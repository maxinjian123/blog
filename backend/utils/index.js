const fs = require('fs/promises');
const path = require('path');
const {v4: uuidv4} = require('uuid');


// 加载prompt文件
async function loadPrompt(file) {
    // 路径
    const filePath = path.join(__dirname, '../prompt', file);

    const f = await fs.readFile(filePath, 'utf8');

    return f;
}

// 替换占位符{{}}
function replacePlaceholders(prompt, placeholders) {
    return prompt.replace(/\{\{(.*?)\}\}/g, (match, placeholder) => {
        return placeholders[placeholder] || match;
    });
}

/**
 * 生成无横线32位UUID
 * @returns {string} 纯32位uuid
 */
function getPureUUID() {
    return uuidv4().replace(/-/g, '')
}

module.exports = {
    loadPrompt,
    getPureUUID,
    replacePlaceholders
};