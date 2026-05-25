const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { success } = require('../utils/response');
const { User } = require('../models');

const router = express.Router();

router.get('/info', optionalAuth, async (req, res, next) => {
  try {
    const admin = await User.findOne({
      where: { role: 'admin' },
      attributes: ['id', 'nickname', 'email', 'avatar', 'role']
    });

    const siteInfo = {
      site_name: 'LinzyBlog',
      author_email: admin?.email || '',
      site_description: '记录技术学习与思考的个人博客',
      author_name: admin?.nickname || 'Linzy',
      author_bio: 'Backend Developer',
      author_avatar: admin?.avatar || null,
    };

    return success(res, siteInfo);
  } catch (err) {
    next(err);
  }
});

module.exports = router;