const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { auth } = require('../middleware/auth')
const { success, error } = require('../utils/response')
const config = require('../config')
const { User } = require('../models')

const router = express.Router()

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log(hashedPassword)
    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 400)
    }

    const user = await User.findOne({ where: { username } })
    if (!user) {
      return error(res, '用户名或密码错误', 401)
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return error(res, '用户名或密码错误', 401)
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })

    return success(
      res,
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        }
      },
      '登录成功'
    )
  } catch (err) {
    next(err)
  }
})

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return error(res, '用户名、邮箱和密码不能为空', 400)
    }

    const existingUser = await User.findOne({
      where: { [require('sequelize').Op.or]: [{ username }, { email }] }
    })
    if (existingUser) {
      return error(res, '用户名或邮箱已存在', 409)
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user'
    })

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })

    return success(
      res,
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        }
      },
      '注册成功',
      201
    )
  } catch (err) {
    next(err)
  }
})

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    })
    if (!user) {
      return error(res, '用户不存在', 404)
    }
    return success(res, user)
  } catch (err) {
    next(err)
  }
})

router.put('/password', auth, async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body

    if (!old_password || !new_password) {
      return error(res, '旧密码和新密码不能为空', 400)
    }

    if (new_password.length < 6) {
      return error(res, '新密码至少需要6个字符', 400)
    }

    const user = await User.findByPk(req.user.id)
    if (!user) {
      return error(res, '用户不存在', 404)
    }

    const isMatch = await bcrypt.compare(old_password, user.password)
    if (!isMatch) {
      return error(res, '旧密码错误', 401)
    }

    const hashedPassword = await bcrypt.hash(new_password, 10)
    await user.update({ password: hashedPassword })

    return success(res, null, '密码修改成功')
  } catch (err) {
    next(err)
  }
})

module.exports = router
