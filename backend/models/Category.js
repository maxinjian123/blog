const {DataTypes} = require('sequelize');
const {getPureUUID} = require("../utils");

module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
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
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'categories',
        timestamps: false
    });

    return Category;
};