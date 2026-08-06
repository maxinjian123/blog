const { DataTypes } = require('sequelize');
const {getPureUUID} = require("../utils");

module.exports = (sequelize) => {
  const Article = sequelize.define('Article', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => getPureUUID()
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cover: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft'
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    like_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_ai_generated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否精选（首页精选展示）'
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '定时发布时间（到点自动将 status 从 draft 改为 published）'
    },
    content_type: {
      type: DataTypes.ENUM('html', 'markdown'),
      defaultValue: 'html'
    },
    catalog: {
      type: DataTypes.JSON,
      allowNull: true
    },
    source_platform: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '文章来源平台标识（juejin/zhihu/csdn/rss 等）'
    },
    source_author: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '文章原始作者'
    },
    source_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      comment: '文章原始链接'
    },
    source_license: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '文章来源版权/授权说明'
    },
    article_type: {
      type: DataTypes.ENUM('original', 'repost', 'translation'),
      defaultValue: 'original',
      allowNull: false,
      comment: '文章类型：original=原创 / repost=转载 / translation=翻译'
    },
    original_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      comment: '原文链接（转载/翻译时填写）'
    },
    original_authorized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '原文允许转载/翻译或本次已获得原文作者授权'
    },
    creation_declaration: {
      type: DataTypes.ENUM('none', 'ai_assisted', 'network_recompiled', 'personal_opinion'),
      defaultValue: 'none',
      allowNull: false,
      comment: '创作声明：none=无声明 / ai_assisted=部分内容由AI辅助生成 / network_recompiled=内容来源网络进行整合再创作 / personal_opinion=个人观点仅供参考'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'articles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Article;
};