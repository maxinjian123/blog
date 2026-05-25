const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ArticleTags = sequelize.define('ArticleTags', {
    article_id: {
      type: DataTypes.STRING(36),
    },
    tag_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
    }
  }, {
    tableName: 'article_tags',
    timestamps: false
  });

  return ArticleTags;
};