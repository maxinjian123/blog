const nodemailer = require('nodemailer')

let transporter = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: {
        user: '2381345593@qq.com',
        pass: 'bytruzmkfmdiecfd'
      }
    })
  }
  return transporter
}

/**
 * 发送评论回复通知邮件
 * @param {string} to - 收件人邮箱
 * @param {string} articleTitle - 文章标题
 * @param {string} replyContent - 回复内容
 * @param {string} replyAuthor - 回复者昵称
 * @param {string} articleUrl - 文章链接
 */
async function sendReplyNotification({ to, articleTitle, replyContent, replyAuthor, articleUrl }) {
  if (!to) return

  try {
    const transporter = getTransporter()
    const info = await transporter.sendMail({
      from: '"LinzyBlog 评论通知" <2381345593@qq.com>',
      to,
      subject: `【LinzyBlog】${replyAuthor} 回复了你的评论`,
      html: `
        <div style="max-width:600px;margin:0 auto;padding:20px;font-family:'Microsoft YaHei',sans-serif;background:#f5f7fa;border-radius:8px">
          <div style="background:linear-gradient(135deg,#49B1F5,#7dd3fc);padding:20px;border-radius:8px 8px 0 0;text-align:center">
            <h2 style="color:#fff;margin:0;font-size:20px">LinzyBlog</h2>
          </div>
          <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <p style="color:#333;font-size:15px;line-height:1.6">
              <strong style="color:#49B1F5">${replyAuthor}</strong> 回复了你在文章
              <strong>《${articleTitle}》</strong> 中的评论：
            </p>
            <div style="background:#f0f7ff;padding:16px;border-radius:6px;margin:16px 0;border-left:3px solid #49B1F5">
              <p style="color:#555;font-size:14px;line-height:1.6;margin:0">${replyContent}</p>
            </div>
            <a href="${articleUrl}" style="display:inline-block;background:linear-gradient(135deg,#49B1F5,#63c4f7);color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;margin-top:8px">查看详情</a>
          </div>
        </div>
      `
    })
    console.log('[Mail] 回复通知已发送:', info.messageId)
    return true
  } catch (err) {
    console.error('[Mail] 发送失败:', err.message)
    return false
  }
}

module.exports = { sendReplyNotification }