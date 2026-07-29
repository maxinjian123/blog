const { DataTypes } = require('sequelize');
const {getPureUUID} = require("../utils");

module.exports = (sequelize) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      autoIncrement: true,
      defaultValue: () => getPureUUID()
    },
    article_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: '文章 ID'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    parent_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    author_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    author_email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    content_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'text'
    },
    is_ai_reply: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    like_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'comments',
    timestamps: false
  });

  return Comment;
};