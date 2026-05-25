const { DataTypes } = require('sequelize');
const {getPureUUID} = require("../utils");

module.exports = (sequelize) => {
  const Tag = sequelize.define('Tag', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => getPureUUID()
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'tags',
    timestamps: false
  });

  return Tag;
};