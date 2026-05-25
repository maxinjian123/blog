const express = require('express')
const svgCaptcha = require('svg-captcha')
const redis = require('../utils/redis')
const { success, error } = require('../utils/response')
const { v4: uuidv4 } = require('uuid')

const router = express.Router()

// 生成验证码
router.get('/', async (req, res) => {
  try {
    const captcha = svgCaptcha.createMathExpr({
      // 替换成简单字符
      // noise: 2,
      // color: true,
      // background: '#f0f0f0'
      mathMin: 1,
      mathMax: 20,
      mathOperator: '+'
    })

    const captchaKey = uuidv4()

    // 存入 Redis, 5分钟过期
    await redis.set(`captcha:${captchaKey}`, captcha.text.toLowerCase(), 'EX', 300)

    return success(res, {
      key: captchaKey,
      svg: captcha.data
    })
  } catch (err) {
    return error(res, '验证码生成失败', 500)
  }
})

// 校验验证码（内部使用）
async function verifyCaptcha(key, code) {
  if (!key || !code) return false
  try {
    const stored = await redis.get(`captcha:${key}`)
    if (!stored) return false
    // 验证后删除，防止重复使用
    await redis.del(`captcha:${key}`)
    return stored === code.toLowerCase()
  } catch {
    return false
  }
}

// 将 verifyCaptcha 挂载到 router 上
router.verifyCaptcha = verifyCaptcha

module.exports = router