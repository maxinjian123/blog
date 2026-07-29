/**
 * 邮件模板加载与渲染
 *
 * 设计：
 * - 每个模板是一个独立目录，目录名即模板 key
 * - 目录内 subject.txt 为邮件主题，body.html 为正文（已渲染好的 HTML 片段）
 * - 顶层 _layouts/ 目录存放共用布局（subject/body 渲染时会自动套上布局）
 * - 支持 {{var}} 变量替换与 {{#if var}}...{{/if}} 条件块
 * - HTML 自动转义用户可控字段，避免模板注入
 */
const fs = require('fs')
const path = require('path')

const TEMPLATE_DIR = path.join(__dirname, '..', 'email-templates')

/**
 * 模板注册表：key -> { layout: 'comment' | 'subscribe' | null, defaultTitle: string }
 *  - layout 为 null 时不套布局（仅 body 自身是完整 HTML 时使用）
 *  - defaultTitle 用于在 body 渲染标题时回退
 */
const TEMPLATES = {
  'comment-reply':     { layout: 'comment',   defaultTitle: '评论回复通知' },
  'subscribe-confirm': { layout: 'subscribe', defaultTitle: '请确认你的订阅' },
  'subscribe-success': { layout: 'subscribe', defaultTitle: '订阅成功' },
  'new-article':       { layout: 'subscribe', defaultTitle: '新文章发布' }
}

// 启动时一次性读取所有模板到内存，避免每次发邮件都读文件
const cache = {}

function loadAll() {
  for (const [key, meta] of Object.entries(TEMPLATES)) {
    const dir = path.join(TEMPLATE_DIR, key)
    const subject = fs.readFileSync(path.join(dir, 'subject.txt'), 'utf8').trim()
    const body = fs.readFileSync(path.join(dir, 'body.html'), 'utf8')
    let layout = null
    if (meta.layout) {
      const layoutFile = path.join(TEMPLATE_DIR, '_layouts', `${meta.layout}-layout.html`)
      if (fs.existsSync(layoutFile)) {
        layout = fs.readFileSync(layoutFile, 'utf8')
      }
    }
    cache[key] = { subject, body, layout, defaultTitle: meta.defaultTitle }
  }
  console.log(`[EmailTemplates] 已加载 ${Object.keys(cache).length} 套邮件模板`)
}

// HTML 实体转义，防止用户输入破坏 HTML 结构
function escapeHtml(value) {
  if (value === undefined || value === null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 把模板中的 HTML 注释 <!-- ... --> 抽出暂存，避免变量替换时里面的 < > 被转义
function stashComments(template) {
  const stash = []
  const out = template.replace(/<!--[\s\S]*?-->/g, (m) => {
    stash.push(m)
    return `\u0000COMMENT_${stash.length - 1}\u0000`
  })
  return { out, stash }
}

function restoreComments(rendered, stash) {
  return rendered.replace(/\u0000COMMENT_(\d+)\u0000/g, (_, idx) => stash[Number(idx)])
}

/**
 * 替换模板中的 {{var}} 占位符
 * - 字符串值会做 HTML 转义
 * - 数字 / 布尔保持原值
 * - 值以 [HTML] 前缀开头时，视为可信 HTML 不做转义（用于向布局注入 body 等完整片段）
 */
function replaceVars(template, vars) {
  return template.replace(/\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g, (_, key) => {
    if (!(key in vars)) return ''
    const v = vars[key]
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
    if (typeof v === 'string' && v.startsWith('[HTML]')) return v.slice(6)
    return escapeHtml(v)
  })
}

/**
 * 处理 {{#if var}}...{{/if}} 条件块
 * - 变量为非空字符串/数字/true 时保留内部内容
 * - 内部仍会进行 {{var}} 替换
 */
function processConditionals(template, vars) {
  return template.replace(/\{\{#if\s+([a-zA-Z_][\w]*)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, inner) => {
    const v = vars[key]
    const truthy = v !== undefined && v !== null && v !== '' && v !== false
    if (!truthy) return ''
    return replaceVars(inner, vars)
  })
}

function renderTemplate(templateStr, vars) {
  // 先把 HTML 注释抽出，避免替换占位符时其中的 < / > 被转义
  const { out: stashed, stash } = stashComments(templateStr)
  let out = processConditionals(stashed, vars)
  out = replaceVars(out, vars)
  return restoreComments(out, stash)
}

/**
 * 渲染一封完整邮件
 * @param {string} key - 模板 key
 * @param {object} vars - 变量集合（必须包含 siteName）
 * @returns {{ subject: string, html: string } | null}
 */
function renderEmail(key, vars = {}) {
  const tpl = cache[key]
  if (!tpl) {
    console.error(`[EmailTemplates] 未找到模板: ${key}`)
    return null
  }

  const merged = { siteName: vars.siteName || 'Blog', ...vars }
  const title = merged.title || tpl.defaultTitle
  merged.title = title

  const bodyHtml = renderTemplate(tpl.body, merged)
  const subject = renderTemplate(tpl.subject, merged)

  let html
  if (tpl.layout) {
    html = renderTemplate(tpl.layout, { ...merged, body: '[HTML]' + bodyHtml })
  } else {
    html = bodyHtml
  }

  return { subject, html }
}

// 预加载一次
loadAll()

module.exports = {
  renderEmail,
  // 仅在调试时使用：重新从磁盘加载（修改模板无需重启服务）
  reload: loadAll
}
