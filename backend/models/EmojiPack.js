const {DataTypes} = require('sequelize');

module.exports = (sequelize) => {
    const EmojiPack = sequelize.define('EmojiPack', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: '',
            comment: '表情包名称'
        },
        url: {
            type: DataTypes.STRING(1000),
            allowNull: false,
            comment: '图片地址（手动链接 / 媒体库 / 上传）'
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: 'default',
            comment: '表情包分类'
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
        tableName: 'emoji_packs',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return EmojiPack;
};
