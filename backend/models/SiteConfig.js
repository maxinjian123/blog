const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SiteConfig = sequelize.define('SiteConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    config_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '配置键名'
    },
    config_value: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '配置值（JSON 字符串或纯文本）'
    },
    category: {
      type: DataTypes.STRING(50),
      defaultValue: 'general',
      comment: '配置分类：general/mail/upload/site'
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '配置说明'
    }
  }, {
    tableName: 'site_configs',
    timestamps: true,
    underscored: true
  });

  return SiteConfig;
};
