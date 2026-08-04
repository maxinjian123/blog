const {DataTypes} = require('sequelize');

module.exports = (sequelize) => {
    const Emoji = sequelize.define('Emoji', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        emoji: {
            // BINARY 排序规则：utf8mb4_unicode_ci 会把不同 emoji 视为相等，
            // 导致唯一索引只能存一个表情，必须使用 utf8mb4_bin 精确比较
            type: DataTypes.STRING(32).BINARY,
            allowNull: false,
            unique: true,
            comment: '表情字符'
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: '',
            comment: '表情名称/备注'
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: 'default',
            comment: '表情分类'
        },
        sort_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '排序（越小越靠前）'
        },
        enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '是否在编辑器工具栏展示'
        }
    }, {
        tableName: 'emojis',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Emoji;
};
