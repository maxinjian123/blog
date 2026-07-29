const nodemailer = require('nodemailer')
const config = require('../config')
const emailTemplates = require('./emailTemplates')

let transporter = null

// 邮件服务是否已配置（缺少账号/授权码时跳过发送而不是报错）
function isMailEnabled() {
  return Boolean(config.mail.user && config.mail.pass)
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: {
        user: config.mail.user,
        pass: config.mail.pass
      },
      // 避免网络异常时长时间挂起请求
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    })
  }
  return transporter
}

// 保存邮件配置后调用：销毁旧 transporter，下次发送时按最新配置重建
function resetTransporter() {
  if (transporter) {
    try { transporter.close() } catch (_) { /* noop */ }
    transporter = null
  }
}

// 启动时验证 SMTP 配置，便于及早发现配置错误
async function verifyMailer() {
  if (!isMailEnabled()) {
    console.warn('[Mail] 未配置 MAIL_USER/MAIL_PASS，邮件功能已禁用')
    return false
  }
  try {
    await getTransporter().verify()
    console.log('[Mail] SMTP 连接验证成功:', config.mail.host)
    return true
  } catch (err) {
    console.error('[Mail] SMTP 连接验证失败:', err.message)
    return false
  }
}

function fromAddress() {
  return `"${config.mail.fromName}" <${config.mail.user}>`
}

// 共用的发送入口：渲染模板 + 调用 SMTP
async function sendTemplatedMail(to, templateKey, vars) {
  if (!to || !isMailEnabled()) return false
  const rendered = emailTemplates.renderEmail(templateKey, vars)
  if (!rendered) return false
  try {
    const info = await getTransporter().sendMail({
      from: fromAddress(),
      to,
      subject: rendered.subject,
      html: rendered.html
    })
    console.log(`[Mail] ${templateKey} 已发送:`, info.messageId)
    return true
  } catch (err) {
    console.error(`[Mail] ${templateKey} 发送失败:`, err.message)
    return false
  }
}

/**
 * 拼接评论回复邮件中的"查看详情"链接
 * 优先级：
 *   1. 显式传入的 articleUrl
 *   2. config.commentReplyUrlPrefix（来自 .env 的 COMMENT_REPLY_URL_PREFIX）+ /article/<id>
 *   3. fallbackHost（请求 host，例如开发环境的 localhost:3000）+ /article/<id>
 * @param {{ articleUrl?: string, articleId?: string | number, commentId?: string | number, fallbackHost?: string }} opts
 */
function buildArticleUrl({ articleUrl, articleId, commentId, fallbackHost }) {
  const querySuffix = (commentId === undefined || commentId === null || commentId === '')
    ? ''
    : `?c=${encodeURIComponent(String(commentId))}`

  if (articleUrl) {
    // 即便显式传了 URL，也把 commentId 作为 query 追加
    if (!querySuffix) return articleUrl
    const sep = articleUrl.includes('?') ? '&' : '?'
    return `${articleUrl}${sep}c=${encodeURIComponent(String(commentId))}`
  }
  if (articleId === undefined || articleId === null || articleId === '') {
    return ''
  }
  const prefix = (config.commentReplyUrlPrefix || '').replace(/\/+$/, '')
  if (prefix) {
    return `${prefix}/article/${articleId}${querySuffix}`
  }
  if (fallbackHost) {
    const host = fallbackHost.replace(/\/+$/, '')
    return `${host}/article/${articleId}${querySuffix}`
  }
  return `/article/${articleId}${querySuffix}`
}

/**
 * 发送评论回复通知邮件
 * 模板: email-templates/comment-reply/
 * 布局: comment-layout（蓝色科技风）
 *
 * @param {object} params
 * @param {string} params.to - 收件人邮箱
 * @param {string} params.articleTitle - 文章标题
 * @param {string} params.replyContent - 回复内容
 * @param {string} params.replyAuthor - 回复者昵称
 * @param {string} [params.articleUrl] - 显式指定的查看详情 URL（可选，优先级最高）
 * @param {string|number} [params.articleId] - 文章 ID（用于拼接 URL）
 * @param {string|number} [params.commentId] - 新评论 ID（用于在 URL 末尾追加 ?c=commentId 定位锚点）
 * @param {string} [params.fallbackHost] - 当未配置 COMMENT_REPLY_URL_PREFIX 时使用的回退 host（开发环境用）
 */
async function sendReplyNotification({ to, articleTitle, replyContent, replyAuthor, articleUrl, articleId, commentId, fallbackHost }) {
  const finalUrl = buildArticleUrl({ articleUrl, articleId, commentId, fallbackHost })
  return sendTemplatedMail(to, 'comment-reply', {
    siteName: config.mail.fromName,
    title: '评论回复通知',
    articleTitle,
    replyContent,
    replyAuthor,
    articleUrl: finalUrl
  })
}

/**
 * 发送订阅确认邮件
 * 模板: email-templates/subscribe-confirm/
 * 布局: subscribe-layout（暖橙绿渐变，与评论回复区分）
 */
async function sendSubscribeConfirmation({ to, confirmUrl }) {
  return sendTemplatedMail(to, 'subscribe-confirm', {
    siteName: config.mail.fromName,
    title: '请确认你的订阅',
    email: to,
    confirmUrl
  })
}

/**
 * 订阅确认成功后发送欢迎邮件
 * 模板: email-templates/subscribe-success/
 * 布局: subscribe-layout
 */
async function sendSubscribeSuccess({ to }) {
  return sendTemplatedMail(to, 'subscribe-success', {
    siteName: config.mail.fromName,
    title: '订阅成功',
    email: to,
    siteUrl: config.site?.url || ''
  })
}

/**
 * 向订阅者发送新文章通知
 * 模板: email-templates/new-article/
 * 布局: subscribe-layout
 */
async function sendNewArticleNotification({ recipients, articleTitle, articleSummary, articleUrl, buildUnsubscribeUrl }) {
  if (!recipients?.length || !isMailEnabled()) return false

  let sent = 0
  for (const to of recipients) {
    try {
      const unsubscribeUrl = typeof buildUnsubscribeUrl === 'function' ? buildUnsubscribeUrl(to) : ''
      const rendered = emailTemplates.renderEmail('new-article', {
        siteName: config.mail.fromName,
        title: '新文章发布',
        articleTitle,
        articleSummary,
        articleUrl,
        unsubscribeUrl
      })
      if (!rendered) continue
      await getTransporter().sendMail({
        from: fromAddress(),
        to,
        subject: rendered.subject,
        html: rendered.html
      })
      sent++
    } catch (err) {
      console.error(`[Mail] 新文章通知发送失败 (${to}):`, err.message)
    }
  }
  console.log(`[Mail] 新文章通知发送完成: ${sent}/${recipients.length}`)
  return sent > 0
}

module.exports = {
  isMailEnabled,
  verifyMailer,
  resetTransporter,
  sendReplyNotification,
  sendSubscribeConfirmation,
  sendSubscribeSuccess,
  sendNewArticleNotification
}
