/**
 * @swagger
 * tags:
 *   - name: 认证
 *     description: 用户登录、注册、个人信息
 *   - name: 文章
 *     description: 文章的增删改查、点赞、搜索
 *   - name: 分类
 *     description: 文章分类管理
 *   - name: 标签
 *     description: 文章标签管理
 *   - name: 评论
 *     description: 评论管理
 *   - name: 留言
 *     description: 留言板
 *   - name: 公告
 *     description: 站点公告
 *   - name: 友链
 *     description: 友情链接管理
 *   - name: 订阅
 *     description: 邮件订阅
 *   - name: 上传
 *     description: 文件上传
 *   - name: 媒体库
 *     description: 媒体文件管理
 *   - name: 站点
 *     description: 站点公开信息
 *   - name: 验证码
 *     description: 图形验证码
 *   - name: AI
 *     description: AI 辅助创作
 *   - name: 管理后台
 *     description: 仪表盘、设置、导出、个人信息
 *   - name: SEO
 *     description: 站点地图、RSS、分享
 *   - name: 爬虫
 *     description: GitHub 仓库搜索与文章导入
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string, example: 'admin' }
 *               password: { type: string, example: 'admin123' }
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token: { type: string }
 *                         user: { $ref: '#/components/schemas/User' }
 *
 * /auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: 注册成功
 *
 * /auth/me:
 *   get:
 *     summary: 获取当前登录用户信息
 *     tags: [认证]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *
 * /auth/password:
 *   put:
 *     summary: 修改密码
 *     tags: [认证]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               old_password: { type: string }
 *               new_password: { type: string }
 *     responses:
 *       200:
 *         description: 修改成功
 */

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: 获取文章列表
 *     tags: [文章]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, published, scheduled] }
 *     responses:
 *       200:
 *         description: 成功
 *   post:
 *     summary: 创建文章
 *     tags: [文章]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               summary: { type: string }
 *               cover: { type: string }
 *               category_id: { type: integer }
 *               tag_ids: { type: array, items: { type: integer } }
 *               status: { type: string }
 *               scheduled_at: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: 创建成功
 *
 * /articles/{id}:
 *   get:
 *     summary: 获取文章详情
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *   put:
 *     summary: 更新文章
 *     tags: [文章]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除文章
 *     tags: [文章]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 *
 * /articles/{id}/like:
 *   post:
 *     summary: 点赞文章
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /articles/{id}/share:
 *   get:
 *     summary: 生成文章分享图
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /articles/search:
 *   get:
 *     summary: 搜索文章
 *     tags: [文章]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: 获取分类列表
 *     tags: [分类]
 *     responses:
 *       200:
 *         description: 成功
 *   post:
 *     summary: 创建分类
 *     tags: [分类]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: 创建成功
 *
 * /categories/{id}:
 *   put:
 *     summary: 更新分类
 *     tags: [分类]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除分类
 *     tags: [分类]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 */

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: 获取标签列表
 *     tags: [标签]
 *     responses:
 *       200:
 *         description: 成功
 *   post:
 *     summary: 创建标签
 *     tags: [标签]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       201:
 *         description: 创建成功
 *
 * /tags/{id}:
 *   put:
 *     summary: 更新标签
 *     tags: [标签]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除标签
 *     tags: [标签]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 */

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: 获取评论列表
 *     tags: [评论]
 *     parameters:
 *       - in: query
 *         name: article_id
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *       - in: query
 *         name: approved
 *         schema: { type: boolean }
 *       - in: query
 *         name: keyword
 *         description: 按评论内容模糊搜索
 *         schema: { type: string }
 *       - in: query
 *         name: author
 *         description: 按评论用户（昵称/邮箱/账号名）模糊搜索
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 *   post:
 *     summary: 发表评论
 *     tags: [评论]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: 发表成功
 *
 * /comments/{id}:
 *   delete:
 *     summary: 删除评论
 *     tags: [评论]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 *
 * /comments/{id}/reply:
 *   post:
 *     summary: 回复评论
 *     tags: [评论]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: 回复成功
 */

/**
 * @swagger
 * /guestbook:
 *   get:
 *     summary: 获取留言列表
 *     tags: [留言]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *   post:
 *     summary: 发表留言
 *     tags: [留言]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               author_name: { type: string }
 *               author_email: { type: string }
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: 发表成功
 *
 * /guestbook/{id}:
 *   delete:
 *     summary: 删除留言
 *     tags: [留言]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 */

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: 获取公告列表
 *     tags: [公告]
 *     responses:
 *       200:
 *         description: 成功
 *   post:
 *     summary: 创建公告
 *     tags: [公告]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               status: { type: integer }
 *     responses:
 *       201:
 *         description: 创建成功
 *
 * /announcements/{id}:
 *   put:
 *     summary: 更新公告
 *     tags: [公告]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除公告
 *     tags: [公告]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 */

/**
 * @swagger
 * /links:
 *   get:
 *     summary: 获取友链列表
 *     tags: [友链]
 *     parameters:
 *       - in: query
 *         name: all
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: 成功
 *   post:
 *     summary: 创建友链
 *     tags: [友链]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               url: { type: string }
 *               description: { type: string }
 *               logo: { type: string }
 *               status: { type: integer }
 *     responses:
 *       201:
 *         description: 创建成功
 *
 * /links/{id}:
 *   put:
 *     summary: 更新友链
 *     tags: [友链]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除友链
 *     tags: [友链]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 */

/**
 * @swagger
 * /subscribers:
 *   get:
 *     summary: 获取订阅列表
 *     tags: [订阅]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *   post:
 *     summary: 添加订阅
 *     tags: [订阅]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       201:
 *         description: 订阅成功
 *
 * /subscribers/{id}:
 *   delete:
 *     summary: 取消订阅/删除订阅
 *     tags: [订阅]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: 通用文件上传
 *     tags: [上传]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *     responses:
 *       201:
 *         description: 上传成功
 *
 * /upload/multiple:
 *   post:
 *     summary: 批量文件上传
 *     tags: [上传]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *     responses:
 *       201:
 *         description: 上传成功
 *
 * /comment-upload:
 *   post:
 *     summary: 评论图片上传
 *     tags: [上传]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: 上传成功
 */

/**
 * @swagger
 * /media:
 *   get:
 *     summary: 获取媒体文件列表
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 24 }
 *       - in: query
 *         name: storage
 *         schema: { type: string, enum: [local, minio] }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *       - in: query
 *         name: mime
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         list:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/MediaFile'
 *   post:
 *     summary: 上传媒体文件
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *     responses:
 *       201:
 *         description: 上传成功
 *
 * /media/{id}:
 *   put:
 *     summary: 修改媒体文件信息
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               original_name: { type: string }
 *     responses:
 *       200:
 *         description: 修改成功
 *   delete:
 *     summary: 删除媒体文件
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 删除成功
 *
 * /media/batch-delete:
 *   post:
 *     summary: 批量删除媒体文件
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: 删除成功
 *
 * /media/stats:
 *   get:
 *     summary: 获取媒体库统计
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */

/**
 * @swagger
 * /site:
 *   get:
 *     summary: 获取站点公开信息
 *     tags: [站点]
 *     responses:
 *       200:
 *         description: 成功
 *
 * /site/config:
 *   get:
 *     summary: 获取站点配置
 *     tags: [站点]
 *     responses:
 *       200:
 *         description: 成功
 */

/**
 * @swagger
 * /captcha:
 *   get:
 *     summary: 获取图形验证码
 *     tags: [验证码]
 *     responses:
 *       200:
 *         description: 成功
 */

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: AI 聊天
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message: { type: string }
 *               systemPrompt: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /ai/write:
 *   post:
 *     summary: AI 创作文章
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt: { type: string }
 *               style: { type: string }
 *               length: { type: string }
 *               content_type: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /ai/summary:
 *   post:
 *     summary: AI 生成摘要
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *               maxLength: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /ai/tags:
 *   post:
 *     summary: AI 生成标签
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *               title: { type: string }
 *               count: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /ai/cover:
 *   post:
 *     summary: AI 生成封面
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt: { type: string }
 *               title: { type: string }
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: 获取仪表盘统计数据
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *
 * /admin/settings:
 *   get:
 *     summary: 获取系统设置
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *   put:
 *     summary: 保存系统设置
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: 保存成功
 *
 * /admin/cache/clear:
 *   post:
 *     summary: 清除缓存
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 清除成功
 *
 * /admin/test-mail:
 *   post:
 *     summary: 发送测试邮件
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to: { type: string }
 *     responses:
 *       200:
 *         description: 发送成功
 *
 * /admin/export:
 *   get:
 *     summary: 导出博客数据
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 导出成功
 *
 * /admin/stats/recent-visitors:
 *   get:
 *     summary: 获取最近访客明细
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /admin/profile:
 *   get:
 *     summary: 获取管理员个人信息
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *   put:
 *     summary: 更新管理员个人信息
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname: { type: string }
 *               email: { type: string }
 *               avatar: { type: string }
 *     responses:
 *       200:
 *         description: 更新成功
 *
 * /admin/profile/password:
 *   put:
 *     summary: 修改管理员密码
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               old_password: { type: string }
 *               new_password: { type: string }
 *     responses:
 *       200:
 *         description: 修改成功
 */

/**
 * @swagger
 * /sitemap.xml:
 *   get:
 *     summary: 获取站点地图
 *     tags: [SEO]
 *     responses:
 *       200:
 *         description: 成功
 *
 * /rss:
 *   get:
 *     summary: 获取 RSS 订阅
 *     tags: [SEO]
 *     responses:
 *       200:
 *         description: 成功
 */

module.exports = {};
