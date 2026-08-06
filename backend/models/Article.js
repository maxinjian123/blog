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