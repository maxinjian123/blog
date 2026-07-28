const {DataTypes} = require('sequelize');

module.exports = (sequelize) => {
    const Link = sequelize.define('Link', {
        id: {
            type: DataTypes.STRING(36),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '友链站点名称'
        },
        url: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: '友链地址'
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: '站点描述'
        },
        avatar: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: '站点头像/Logo URL'
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: '友情链接',
            comment: '友链分类'
        },
        sort_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '排序（越小越靠前）'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '是否启用'
        }
    }, {
        tableName: 'links',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Link;
};
