const { DataTypes } = require('sequelize');
const { getPureUUID } = require('../utils');

module.exports = (sequelize) => {
  const ArticleVersion = sequelize.define('ArticleVersion', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => getPureUUID()
    },
    article_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: '所属文章 ID'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
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
    category_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    content_type: {
      type: DataTypes.ENUM('html', 'markdown'),
      defaultValue: 'markdown'
    },
    catalog: {
      type: DataTypes.JSON,
      allowNull: true
    },
    version_note: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '版本备注（可选）'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '保存版本的用户 ID'
    }
  }, {
    tableName: 'article_versions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ArticleVersion;
};
