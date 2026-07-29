const { DataTypes } = require('sequelize');
const { getPureUUID } = require('../utils');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => getPureUUID()
    },
    parent_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      comment: '父级留言 ID，支持嵌套回复'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '登录用户 ID'
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
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    like_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'messages',
    timestamps: false
  });

  return Message;
};
