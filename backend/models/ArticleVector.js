const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ArticleVector = sequelize.define('ArticleVector', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    article_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    embedding: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    chunk_index: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    chunk_text: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'article_vectors',
    timestamps: false
  });

  return ArticleVector;
};