import DOMPurify from 'dompurify'

// 统一的 HTML 消毒配置：允许常见富文本标签，禁止脚本/事件属性
const purifyConfig = {
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['style', 'form', 'input', 'iframe'],
}

// 外链统一加 rel 防护
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer nofollow')
  }
})

/** 消毒任意 HTML 字符串（用于 v-html 前） */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, purifyConfig) as string
}

/** 转义纯文本中的 HTML 特殊字符 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 纯文本转安全 HTML（转义 + 换行转 <br>） */
export function textToSafeHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>')
}
