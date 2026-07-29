const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Subscriber = sequelize.define('Subscriber', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'unsubscribed'),
      defaultValue: 'pending',
      comment: 'pending 待确认 / active 已确认 / unsubscribed 已退订'
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: () => crypto.randomBytes(32).toString('hex'),
      comment: '确认/退订令牌'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true
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
    tableName: 'subscribers',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Subscriber;
};
