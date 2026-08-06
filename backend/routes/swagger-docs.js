/**
 * @swagger
 * tags:
 *   - name: 认证
 *     description: 用户登录、注册、个人信息
 *   - name: 文章
 *     description: 文章的增删改查、点赞、搜索、版本、评论
 *   - name: 分类
 *     description: 文章分类管理
 *   - name: 标签
 *     description: 文章标签管理
 *   - name: 评论
 *     description: 评论管理（后台审核、回复）
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
 *   - name: 图片抓取
 *     description: 图片素材搜索与下载
 *   - name: 音乐爬虫
 *     description: 音乐搜索、导入与音乐库管理
 *   - name: 歌单管理
 *     description: 歌单与歌曲管理
 *   - name: 表情管理
 *     description: 编辑器表情与表情包管理
 *   - name: 操作日志
 *     description: 后台操作日志查询与清理
 *   - name: 数据备份
 *     description: 数据库备份、恢复与定时备份
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
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *                 example: admin
 *               password:
 *                 type: string
 *                 description: 密码
 *                 example: admin123
 *     responses:
 *       200:
 *         description: 登录成功，返回 token 与用户信息
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
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱
 *               password:
 *                 type: string
 *                 description: 密码（至少 6 位）
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
 *             required: [old_password, new_password]
 *             properties:
 *               old_password:
 *                 type: string
 *                 description: 旧密码
 *               new_password:
 *                 type: string
 *                 description: 新密码（至少 6 位）
 *     responses:
 *       200:
 *         description: 修改成功
 */

/**
 * @swagger
 * /articles/archive:
 *   get:
 *     summary: 获取文章归档（按年月分组）
 *     tags: [文章]
 *     responses:
 *       200:
 *         description: 成功
 *
 * /articles:
 *   get:
 *     summary: 获取文章列表
 *     tags: [文章]
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 页码，从 1 开始
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         description: 文章状态（客户端请求会自动忽略，仅返回已发布）
 *         schema: { type: string, enum: [draft, published, scheduled] }
 *       - in: query
 *         name: category_id
 *         description: 按分类 ID 筛选
 *         schema: { type: integer }
 *       - in: query
 *         name: tag_id
 *         description: 按标签 ID 筛选
 *         schema: { type: integer }
 *       - in: query
 *         name: keyword
 *         description: 按标题/摘要关键词搜索
 *         schema: { type: string }
 *       - in: query
 *         name: featured
 *         description: 是否仅返回推荐（置顶）文章
 *         schema: { type: boolean }
 *       - in: query
 *         name: sort
 *         description: 排序字段（白名单：created_at/view_count/like_count/published_at/updated_at）
 *         schema: { type: string, default: created_at }
 *       - in: query
 *         name: order
 *         description: 排序方向
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
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
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 description: 文章标题
 *               slug:
 *                 type: string
 *                 description: 自定义链接别名（不传则根据标题自动生成）
 *               content:
 *                 type: string
 *                 description: 文章内容（HTML 或 Markdown）
 *               summary:
 *                 type: string
 *                 description: 文章摘要
 *               cover:
 *                 type: string
 *                 description: 封面图 URL
 *               status:
 *                 type: string
 *                 description: 文章状态
 *                 enum: [draft, published, scheduled]
 *                 default: draft
 *               category_id:
 *                 type: integer
 *                 description: 分类 ID
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *                 description: 标签名称数组（不存在则自动创建）
 *               content_type:
 *                 type: string
 *                 description: 内容类型
 *                 enum: [html, markdown]
 *                 default: html
 *               catalog:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text: { type: string }
 *                     level: { type: integer }
 *                 description: 文章目录（markdown 时自动提取，可手动传入）
 *               featured:
 *                 type: boolean
 *                 description: 是否推荐/置顶
 *                 default: false
 *               article_type:
 *                 type: string
 *                 enum: [original, repost, translation]
 *                 description: 文章类型（original=原创 / repost=转载 / translation=翻译）
 *                 default: original
 *               original_url:
 *                 type: string
 *                 description: 原文链接（转载/翻译时填写，原创留空）
 *               original_authorized:
 *                 type: boolean
 *                 description: 原文允许转载/翻译或本次已获得原文作者授权
 *                 default: false
 *               creation_declaration:
 *                 type: string
 *                 enum: [none, ai_assisted, network_recompiled, personal_opinion]
 *                 description: 创作声明（none=无声明 / ai_assisted=部分内容由AI辅助生成 / network_recompiled=内容来源网络进行整合再创作 / personal_opinion=个人观点仅供参考）
 *                 default: none
 *     responses:
 *       201:
 *         description: 创建成功
 *
 * /articles/export:
 *   get:
 *     summary: 批量导出文章（JSON 文件下载）
 *     tags: [文章]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ids
 *         description: 文章 ID 列表，逗号分隔（如 1,2,3）
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         description: 按状态过滤
 *         schema: { type: string, enum: [draft, published, scheduled] }
 *     responses:
 *       200:
 *         description: 导出成功（JSON 附件）
 *
 * /articles/import:
 *   post:
 *     summary: 批量导入文章（JSON）
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
 *               articles:
 *                 type: array
 *                 description: 文章数组（也可直接传数组）
 *                 items:
 *                   type: object
 *                   properties:
 *                     title: { type: string, description: 标题（必填） }
 *                     slug: { type: string, description: 链接别名，重复时自动加后缀 }
 *                     content: { type: string, description: 内容（必填） }
 *                     content_type: { type: string, enum: [html, markdown], description: 内容类型 }
 *                     summary: { type: string, description: 摘要 }
 *                     cover: { type: string, description: 封面 URL }
 *                     status: { type: string, enum: [draft, published], description: 状态 }
 *                     catalog: { type: array, description: 目录 }
 *                     category_name: { type: string, description: 分类名称（按名称匹配，不存在则跳过） }
 *                     tags: { type: array, items: { type: string }, description: 标签名称数组 }
 *                     published_at: { type: string, format: date-time, description: 发布时间 }
 *     responses:
 *       200:
 *         description: 导入结果（成功/失败计数）
 *
 * /articles/{id}:
 *   get:
 *     summary: 获取文章详情（自动增加阅读量）
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *   put:
 *     summary: 更新文章（内容变更自动保存版本历史）
 *     tags: [文章]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, description: 标题 }
 *               slug: { type: string, description: 链接别名 }
 *               content: { type: string, description: 内容 }
 *               summary: { type: string, description: 摘要 }
 *               cover: { type: string, description: 封面 URL }
 *               status:
 *                 type: string
 *                 description: 状态
 *                 enum: [draft, published, scheduled]
 *               category_id: { type: integer, description: 分类 ID }
 *               tags: { type: array, items: { type: string }, description: 标签名称数组 }
 *               content_type: { type: string, enum: [html, markdown], description: 内容类型 }
 *               catalog: { type: array, description: 目录 }
 *               scheduled_at: { type: string, format: date-time, description: 定时发布时间 }
 *               featured: { type: boolean, description: 是否推荐 }
 *               article_type:
 *                 type: string
 *                 enum: [original, repost, translation]
 *                 description: 文章类型（original=原创 / repost=转载 / translation=翻译）
 *               original_url:
 *                 type: string
 *                 description: 原文链接（转载/翻译时填写，原创清空）
 *               original_authorized:
 *                 type: boolean
 *                 description: 原文允许转载/翻译或本次已获得原文作者授权
 *               creation_declaration:
 *                 type: string
 *                 enum: [none, ai_assisted, network_recompiled, personal_opinion]
 *                 description: 创作声明（none=无声明 / ai_assisted=部分内容由AI辅助生成 / network_recompiled=内容来源网络进行整合再创作 / personal_opinion=个人观点仅供参考）
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除文章（级联删除版本历史）
 *     tags: [文章]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 *
 * /articles/{id}/preview:
 *   get:
 *     summary: 草稿预览（不受发布状态限制，不计阅读量）
 *     tags: [文章]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /articles/{id}/related:
 *   get:
 *     summary: 相关文章推荐（同标签优先，同分类兜底）
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         description: 返回数量
 *         schema: { type: integer, default: 3 }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /articles/{id}/neighbors:
 *   get:
 *     summary: 上下篇导航（按发布时间排序）
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /articles/batch-delete:
 *   post:
 *     summary: 批量删除文章
 *     tags: [文章]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: integer }
 *                 description: 文章 ID 数组
 *     responses:
 *       200:
 *         description: 删除成功
 *
 * /articles/{id}/versions:
 *   get:
 *     summary: 获取文章版本历史列表
 *     tags: [文章]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /articles/{id}/versions/{versionId}:
 *   get:
 *     summary: 获取单个版本详情（含完整内容）
 *     tags: [文章]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *       - in: path
 *         name: versionId
 *         required: true
 *         description: 版本 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /articles/{id}/versions/{versionId}/restore:
 *   post:
 *     summary: 恢复到指定版本（当前内容自动保存为新版本）
 *     tags: [文章]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *       - in: path
 *         name: versionId
 *         required: true
 *         description: 版本 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 恢复成功
 *
 * /articles/{id}/comments:
 *   get:
 *     summary: 获取文章评论（游标分页，支持嵌套回复）
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *       - in: query
 *         name: cursor
 *         description: 游标（latest 传末条评论 id，hot 传累计偏移量）
 *         schema: { type: string }
 *       - in: query
 *         name: pageSize
 *         description: 每页顶层评论数量
 *         schema: { type: integer, default: 30 }
 *       - in: query
 *         name: sort
 *         description: 排序方式
 *         schema: { type: string, enum: [latest, hot], default: latest }
 *     responses:
 *       200:
 *         description: 成功
 *   post:
 *     summary: 发表评论（需 QQ 号与图形验证码）
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, qq_number, captcha_key, captcha_code]
 *             properties:
 *               content:
 *                 type: string
 *                 description: 评论内容
 *               qq_number:
 *                 type: string
 *                 description: QQ 号（5-12 位，用于获取头像昵称）
 *               parent_id:
 *                 type: integer
 *                 description: 父评论 ID（回复评论时传入）
 *               content_type:
 *                 type: string
 *                 description: 内容类型
 *                 enum: [markdown, text]
 *                 default: text
 *               captcha_key:
 *                 type: string
 *                 description: 验证码 key（GET /captcha 获取）
 *               captcha_code:
 *                 type: string
 *                 description: 验证码答案
 *     responses:
 *       201:
 *         description: 发表成功
 *
 * /articles/{id}/comments/{commentId}/like:
 *   post:
 *     summary: 点赞评论（每 IP 每 24 小时一次）
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *       - in: path
 *         name: commentId
 *         required: true
 *         description: 评论 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 点赞成功
 *
 * /articles/{id}/like:
 *   post:
 *     summary: 点赞文章（每 IP 每 24 小时一次）
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 点赞成功
 *
 * /articles/{id}/share:
 *   post:
 *     summary: 记录文章分享次数
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 分享记录成功
 *
 * /articles/{id}/share-count:
 *   get:
 *     summary: 获取文章近 7 天分享次数
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 文章 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: 获取分类列表（含已发布文章数）
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
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: 分类名称
 *               slug:
 *                 type: string
 *                 description: 链接别名（不传自动生成）
 *               description:
 *                 type: string
 *                 description: 分类描述
 *     responses:
 *       201:
 *         description: 创建成功
 *
 * /categories/hot:
 *   get:
 *     summary: 热门分类（按已发布文章数降序，Redis 缓存）
 *     tags: [分类]
 *     parameters:
 *       - in: query
 *         name: limit
 *         description: 返回数量（1-50）
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: 成功
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
 *         description: 分类 ID
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: 分类名称 }
 *               slug: { type: string, description: 链接别名 }
 *               description: { type: string, description: 分类描述 }
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
 *         description: 分类 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 */

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: 获取标签列表（分页，含关联文章数）
 *     tags: [标签]
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort
 *         description: 排序字段（id 或 articleCount）
 *         schema: { type: string, default: id }
 *       - in: query
 *         name: order
 *         description: 排序方向
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *       - in: query
 *         name: keyword
 *         description: 按名称/别名关键词搜索
 *         schema: { type: string }
 *       - in: header
 *         name: All
 *         description: 请求头传 All=true 时返回全量（不分页）
 *         schema: { type: string, enum: [true] }
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
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: 标签名称
 *               slug:
 *                 type: string
 *                 description: 链接别名（不传自动生成）
 *     responses:
 *       201:
 *         description: 创建成功
 *
 * /tags/hot:
 *   get:
 *     summary: 热门标签（按关联已发布文章数降序，Redis 缓存）
 *     tags: [标签]
 *     parameters:
 *       - in: query
 *         name: limit
 *         description: 返回数量（1-100）
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /tags/{id}/articles:
 *   get:
 *     summary: 获取标签下的文章列表（分页）
 *     tags: [标签]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 标签 ID
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: keyword
 *         description: 按标题/状态关键词搜索
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
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
 *         description: 标签 ID
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: 标签名称 }
 *               slug: { type: string, description: 链接别名 }
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
 *         description: 标签 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 */

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: 获取评论列表（后台管理）
 *     tags: [评论]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: approved
 *         description: 审核状态
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
 *
 * /comments/{id}:
 *   put:
 *     summary: 更新评论审核状态
 *     tags: [评论]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 评论 ID
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: 是否通过审核
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除评论（级联删除所有回复）
 *     tags: [评论]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 评论 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 *
 * /comments/{id}/ai-reply:
 *   post:
 *     summary: AI 自动回复评论
 *     tags: [评论]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 评论 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 生成成功
 *
 * /comments/{id}/replies:
 *   get:
 *     summary: 获取评论完整回复线程
 *     tags: [评论]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 评论 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /comments/{id}/reply:
 *   post:
 *     summary: 管理员手动回复评论（可发送邮件通知）
 *     tags: [评论]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 被回复评论 ID
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: 回复内容
 *               content_type:
 *                 type: string
 *                 description: 内容类型
 *                 enum: [markdown, text]
 *                 default: markdown
 *     responses:
 *       200:
 *         description: 回复成功
 */

/**
 * @swagger
 * /guestbook:
 *   get:
 *     summary: 获取留言列表（前台，仅已审核）
 *     tags: [留言]
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: 成功
 *   post:
 *     summary: 发表留言（每 IP 每分钟限 3 条）
 *     tags: [留言]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [author_name, content]
 *             properties:
 *               author_name:
 *                 type: string
 *                 description: 昵称（最多 50 字）
 *               author_email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱（可选）
 *               content:
 *                 type: string
 *                 description: 留言内容（最多 2000 字）
 *               parent_id:
 *                 type: integer
 *                 description: 父留言 ID（回复留言时传入）
 *     responses:
 *       201:
 *         description: 发表成功
 *
 * /guestbook/{id}/like:
 *   post:
 *     summary: 留言点赞
 *     tags: [留言]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 留言 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 点赞成功
 *
 * /guestbook/admin:
 *   get:
 *     summary: 获取留言列表（后台管理）
 *     tags: [留言]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: approved
 *         description: 审核状态
 *         schema: { type: boolean }
 *       - in: query
 *         name: keyword
 *         description: 按留言内容模糊搜索
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /guestbook/{id}:
 *   put:
 *     summary: 更新留言审核状态
 *     tags: [留言]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 留言 ID
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: 是否通过审核
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除留言（级联删除子留言）
 *     tags: [留言]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 留言 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 *
 * /guestbook/{id}/replies:
 *   get:
 *     summary: 获取留言完整回复线程（后台）
 *     tags: [留言]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 留言 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /guestbook/{id}/reply:
 *   post:
 *     summary: 管理员回复留言
 *     tags: [留言]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 被回复留言 ID
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: 回复内容
 *               content_type:
 *                 type: string
 *                 description: 内容类型
 *                 enum: [markdown, text]
 *                 default: markdown
 *     responses:
 *       200:
 *         description: 回复成功
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
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: 公告内容
 *               is_active:
 *                 type: boolean
 *                 description: 是否启用
 *                 default: true
 *               sort_order:
 *                 type: integer
 *                 description: 排序值（越小越靠前）
 *                 default: 0
 *     responses:
 *       201:
 *         description: 创建成功
 *
 * /announcements/latest:
 *   get:
 *     summary: 获取最新启用公告
 *     tags: [公告]
 *     responses:
 *       200:
 *         description: 成功
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
 *         description: 公告 ID
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string, description: 公告内容 }
 *               is_active: { type: boolean, description: 是否启用 }
 *               sort_order: { type: integer, description: 排序值 }
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
 *         description: 公告 ID
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 */

/**
 * @swagger
 * /links:
 *   get:
 *     summary: 获取友链列表（前台仅启用；后台 ?all=true 返回全部）
 *     tags: [友链]
 *     parameters:
 *       - in: query
 *         name: all
 *         description: 后台模式：true 返回全部（含未启用）
 *         schema: { type: boolean }
 *       - in: query
 *         name: active
 *         description: 显式 false 时不过滤启用状态
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
 *             required: [name, url]
 *             properties:
 *               name:
 *                 type: string
 *                 description: 网站名称
 *               url:
 *                 type: string
 *                 description: 网站地址
 *               description:
 *                 type: string
 *                 description: 网站描述
 *               avatar:
 *                 type: string
 *                 description: 头像/Logo URL
 *               category:
 *                 type: string
 *                 description: 分类
 *                 default: 友情链接
 *               sort_order:
 *                 type: integer
 *                 description: 排序值
 *                 default: 0
 *               is_active:
 *                 type: boolean
 *                 description: 是否启用
 *                 default: true
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
 *         description: 友链 ID（UUID）
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: 网站名称 }
 *               url: { type: string, description: 网站地址 }
 *               description: { type: string, description: 网站描述 }
 *               avatar: { type: string, description: 头像 URL }
 *               category: { type: string, description: 分类 }
 *               sort_order: { type: integer, description: 排序值 }
 *               is_active: { type: boolean, description: 是否启用 }
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
 *         description: 友链 ID（UUID）
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 删除成功
 */

/**
 * @swagger
 * /subscribers/subscribe:
 *   post:
 *     summary: 前台订阅（发送确认邮件）
 *     tags: [订阅]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 订阅邮箱
 *     responses:
 *       200:
 *         description: 订阅成功，返回 status 与 confirmUrl
 *
 * /subscribers/confirm/{token}:
 *   get:
 *     summary: 确认订阅（邮件链接打开，返回 HTML 结果页）
 *     tags: [订阅]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: 订阅确认令牌
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: HTML 结果页
 *
 * /subscribers/unsubscribe/{token}:
 *   get:
 *     summary: 取消订阅（邮件链接打开，返回 HTML 结果页）
 *     tags: [订阅]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: 退订令牌
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: HTML 结果页
 *
 * /subscribers/admin:
 *   get:
 *     summary: 获取订阅列表（后台管理）
 *     tags: [订阅]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         description: 订阅状态
 *         schema: { type: string, enum: [pending, active, unsubscribed] }
 *       - in: query
 *         name: keyword
 *         description: 按邮箱模糊搜索
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /subscribers/admin/stats:
 *   get:
 *     summary: 获取订阅统计
 *     tags: [订阅]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *
 * /subscribers/{id}:
 *   delete:
 *     summary: 删除订阅记录
 *     tags: [订阅]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 订阅记录 ID
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
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 上传的文件
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *                 description: 存储源（默认取系统配置）
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
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 文件数组（最多 10 个）
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *                 description: 存储源（默认取系统配置）
 *     responses:
 *       201:
 *         description: 上传成功
 *
 * /comment-upload:
 *   post:
 *     summary: 评论图片上传（无需登录，限流 + NSFW 检测）
 *     tags: [上传]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 图片文件（jpg/png/gif/webp，最大 5MB）
 *     responses:
 *       201:
 *         description: 上传成功
 */

/**
 * @swagger
 * /media/test-minio:
 *   get:
 *     summary: 测试 MinIO 连接
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 连接成功
 *
 * /media/types:
 *   get:
 *     summary: 获取媒体文件类型列表（用于筛选）
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *
 * /media:
 *   get:
 *     summary: 获取媒体文件列表
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 24 }
 *       - in: query
 *         name: storage
 *         description: 存储源筛选
 *         schema: { type: string, enum: [local, minio] }
 *       - in: query
 *         name: keyword
 *         description: 按原文件名/存储名搜索
 *         schema: { type: string }
 *       - in: query
 *         name: mime
 *         description: 按主类型筛选（image/video/audio/application/text）
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功（含 local/minio 统计）
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
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 上传的文件
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *                 description: 存储源（默认取系统配置）
 *     responses:
 *       201:
 *         description: 上传成功
 *
 * /media/multiple:
 *   post:
 *     summary: 批量上传媒体文件
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 文件数组（最多 10 个）
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *                 description: 存储源（默认取系统配置）
 *     responses:
 *       201:
 *         description: 上传成功
 *
 * /media/{id}:
 *   put:
 *     summary: 修改媒体文件信息（重命名）
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 媒体文件 ID（UUID）
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [original_name]
 *             properties:
 *               original_name:
 *                 type: string
 *                 description: 新的文件名
 *     responses:
 *       200:
 *         description: 修改成功
 *   delete:
 *     summary: 删除媒体文件（同步删除存储源文件）
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 媒体文件 ID（UUID）
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
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string }
 *                 description: 媒体文件 ID 数组
 *     responses:
 *       200:
 *         description: 删除成功
 *
 * /media/{id}/migrate:
 *   post:
 *     summary: 迁移单个文件到目标存储源（local ↔ minio）
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 媒体文件 ID（UUID）
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [storage]
 *             properties:
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *                 description: 目标存储源
 *     responses:
 *       200:
 *         description: 迁移成功（自动更新引用旧 URL 的位置）
 *
 * /media/batch-migrate:
 *   post:
 *     summary: 批量迁移文件到目标存储源
 *     tags: [媒体库]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, storage]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string }
 *                 description: 媒体文件 ID 数组
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *                 description: 目标存储源
 *     responses:
 *       200:
 *         description: 迁移结果（成功/失败明细）
 */

/**
 * @swagger
 * /site/info:
 *   get:
 *     summary: 获取站点公开信息（名称、Logo、作者等）
 *     tags: [站点]
 *     responses:
 *       200:
 *         description: 成功
 *
 * /site/stats:
 *   get:
 *     summary: 获取站点统计数据（文章/分类/标签/评论/访客数、运行天数）
 *     tags: [站点]
 *     responses:
 *       200:
 *         description: 成功
 */

/**
 * @swagger
 * /captcha:
 *   get:
 *     summary: 获取图形验证码（返回 key 与 SVG）
 *     tags: [验证码]
 *     responses:
 *       200:
 *         description: 成功，返回 { key, svg }
 */

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: AI 聊天（单轮/多轮）
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: 用户消息（与 content 二选一）
 *               content:
 *                 type: string
 *                 description: 用户消息别名
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role: { type: string, enum: [system, user, assistant], description: 角色 }
 *                     content: { type: string, description: 内容 }
 *                 description: 多轮对话历史
 *               systemPrompt:
 *                 type: string
 *                 description: 系统提示词
 *     responses:
 *       200:
 *         description: 成功
 *
 * /ai/chat/stream:
 *   post:
 *     summary: AI 聊天（SSE 流式输出）
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: 用户消息
 *               content:
 *                 type: string
 *                 description: 用户消息别名
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role: { type: string, enum: [system, user, assistant], description: 角色 }
 *                     content: { type: string, description: 内容 }
 *                 description: 多轮对话历史
 *               systemPrompt:
 *                 type: string
 *                 description: 系统提示词
 *     responses:
 *       200:
 *         description: text/event-stream 流式数据
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
 *             required: [prompt]
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: 创作提示词
 *               style:
 *                 type: string
 *                 description: 文章风格
 *                 default: 专业博客文章
 *               length:
 *                 type: string
 *                 description: 目标字数
 *                 default: '500'
 *               content_type:
 *                 type: string
 *                 enum: [html, markdown]
 *                 description: 输出内容类型
 *                 default: html
 *               language:
 *                 type: string
 *                 description: 输出语言
 *                 default: 中文
 *     responses:
 *       200:
 *         description: 成功
 *
 * /ai/polish:
 *   post:
 *     summary: AI 润色文章
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: 待润色内容
 *               style:
 *                 type: string
 *                 description: 润色风格
 *                 default: 更流畅专业
 *               content_type:
 *                 type: string
 *                 enum: [html, markdown]
 *                 description: 内容类型
 *                 default: html
 *     responses:
 *       200:
 *         description: 成功
 *
 * /ai/continue:
 *   post:
 *     summary: AI 续写文章
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: 已写内容
 *               direction:
 *                 type: string
 *                 description: 续写方向提示
 *               content_type:
 *                 type: string
 *                 enum: [html, markdown]
 *                 description: 内容类型
 *                 default: html
 *     responses:
 *       200:
 *         description: 成功
 *
 * /ai/summary:
 *   post:
 *     summary: AI 生成文章摘要
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: 文章内容（HTML/Markdown）
 *               maxLength:
 *                 type: integer
 *                 description: 摘要最大字数
 *                 default: 200
 *     responses:
 *       200:
 *         description: 成功
 *
 * /ai/format:
 *   post:
 *     summary: AI 智能排版文章
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: 待排版内容
 *               content_type:
 *                 type: string
 *                 enum: [html, markdown]
 *                 description: 内容类型
 *                 default: html
 *     responses:
 *       200:
 *         description: 成功（formatted 为排版后的内容）
 *
 * /ai/tags:
 *   post:
 *     summary: AI 生成文章标签（自动创建标签）
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: 文章内容
 *               title:
 *                 type: string
 *                 description: 文章标题
 *               count:
 *                 type: integer
 *                 description: 生成标签数量
 *                 default: 5
 *     responses:
 *       200:
 *         description: 成功
 *
 * /ai/cover:
 *   post:
 *     summary: AI 生成文章封面
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
 *               prompt:
 *                 type: string
 *                 description: 自定义提示词（提供则直接文生图）
 *               title:
 *                 type: string
 *                 description: 文章标题
 *               content:
 *                 type: string
 *                 description: 文章内容
 *               summary:
 *                 type: string
 *                 description: 文章摘要
 *     responses:
 *       200:
 *         description: 成功
 *
 * /ai/test-connection:
 *   post:
 *     summary: 测试 AI 模型连接（云端/本地 Ollama）
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
 *               target:
 *                 type: string
 *                 enum: [cloud, local]
 *                 description: 测试目标（cloud=云端，local=Ollama）
 *                 default: cloud
 *     responses:
 *       200:
 *         description: 连接成功（含延迟）
 *
 * /ai/auto-reply:
 *   post:
 *     summary: AI 自动回复评论
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [commentContent]
 *             properties:
 *               commentContent:
 *                 type: string
 *                 description: 评论内容
 *               articleTitle:
 *                 type: string
 *                 description: 文章标题（供 AI 参考）
 *     responses:
 *       200:
 *         description: 成功
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: 获取仪表盘统计数据（未登录返回基础计数）
 *     tags: [管理后台]
 *     responses:
 *       200:
 *         description: 成功
 *
 * /admin/stats/source:
 *   get:
 *     summary: 访客来源统计（近 7 天）
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *
 * /admin/stats/device:
 *   get:
 *     summary: 设备分布统计（近 7 天）
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *
 * /admin/stats/hourly:
 *   get:
 *     summary: 24 小时活跃时段分布（今天）
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *
 * /admin/stats/location:
 *   get:
 *     summary: 访客地域分布（近 30 天，省份/城市聚合）
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *
 * /admin/stats/recent-visitors:
 *   get:
 *     summary: 最近访客明细（含地域与文章标题）
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: 成功
 *
 * /admin/settings:
 *   get:
 *     summary: 获取系统设置（按分类分组）
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
 *             required: [configs]
 *             properties:
 *               configs:
 *                 type: array
 *                 description: 配置项数组（key 需在白名单内）
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       description: 配置键（如 site_name、mail_host、minio_endpoint 等）
 *                     value:
 *                       type: string
 *                       description: 配置值
 *     responses:
 *       200:
 *         description: 保存成功
 *
 * /admin/cache/clear:
 *   post:
 *     summary: 清除 Redis 缓存
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
 *             required: [to]
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: 收件邮箱
 *     responses:
 *       200:
 *         description: 发送成功
 *
 * /admin/export:
 *   get:
 *     summary: 导出全部博客数据（JSON 附件）
 *     tags: [管理后台]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 导出成功
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
 *     summary: 更新管理员个人信息（昵称/邮箱/头像）
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
 *               nickname:
 *                 type: string
 *                 description: 昵称
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱（不可与其他用户重复）
 *               avatar:
 *                 type: string
 *                 description: 头像 URL
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
 *             required: [old_password, new_password]
 *             properties:
 *               old_password:
 *                 type: string
 *                 description: 旧密码
 *               new_password:
 *                 type: string
 *                 description: 新密码（至少 6 位）
 *     responses:
 *       200:
 *         description: 修改成功
 */

/**
 * @swagger
 * /rss:
 *   get:
 *     summary: RSS 2.0 订阅源（XML）
 *     tags: [SEO]
 *     responses:
 *       200:
 *         description: 返回 application/rss+xml
 *
 * /sitemap.xml:
 *   get:
 *     summary: 站点地图（sitemap.xml）
 *     tags: [SEO]
 *     responses:
 *       200:
 *         description: 返回 application/xml
 */
