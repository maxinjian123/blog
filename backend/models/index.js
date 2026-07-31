const {Sequelize} = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    {
        host: config.db.host,
        port: Number(config.db.port),
        dialect: config.db.dialect,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    }
);

const User = require('./User')(sequelize);
const Article = require('./Article')(sequelize);
const Category = require('./Category')(sequelize);
const Tag = require('./Tag')(sequelize);
const Comment = require('./Comment')(sequelize);
const VisitorLog = require('./VisitorLog')(sequelize);
const ArticleTag = require('./ArticleTags')(sequelize);
const Announcement = require('./Announcement')(sequelize);
const Link = require('./Link')(sequelize);
const ArticleVersion = require('./ArticleVersion')(sequelize);
const Message = require('./Message')(sequelize);
const Subscriber = require('./Subscriber')(sequelize);
const SiteConfig = require('./SiteConfig')(sequelize);
const MediaFile = require('./MediaFile')(sequelize);
const Music = require('./Music')(sequelize);
const Playlist = require('./Playlist')(sequelize);
const PlaylistSong = require('./PlaylistSong')(sequelize);

User.hasMany(Article, {foreignKey: 'author_id', as: 'articles'});
Article.belongsTo(User, {foreignKey: 'author_id', as: 'author'});

Category.hasMany(Article, {foreignKey: 'category_id', as: 'articles'});
Article.belongsTo(Category, {foreignKey: 'category_id', as: 'category'});

Article.belongsToMany(Tag, {
    through: 'article_tags',
    foreignKey: 'article_id',
    otherKey: 'tag_id',
    as: 'tags',
    timestamps: false
});
Tag.belongsToMany(Article, {
    through: 'article_tags',
    foreignKey: 'tag_id',
    otherKey: 'article_id',
    as: 'articles',
    timestamps: false
});

ArticleTag.belongsTo(Tag, {foreignKey: 'tag_id'})

Article.hasMany(ArticleTag, {foreignKey: 'article_id'})
ArticleTag.belongsTo(Article, {foreignKey: 'article_id'})

Article.hasMany(Comment, {foreignKey: 'article_id', as: 'comments'});
Comment.belongsTo(Article, {foreignKey: 'article_id', as: 'article'});

User.hasMany(Comment, {foreignKey: 'user_id', as: 'comments'});
Comment.belongsTo(User, {foreignKey: 'user_id', as: 'user'});

User.hasMany(Message, {foreignKey: 'user_id', as: 'messages'});
Message.belongsTo(User, {foreignKey: 'user_id', as: 'user'});

Comment.hasMany(Comment, {foreignKey: 'parent_id', as: 'replies'});
Comment.belongsTo(Comment, {foreignKey: 'parent_id', as: 'parent'});

Message.hasMany(Message, {foreignKey: 'parent_id', as: 'replies'});
Message.belongsTo(Message, {foreignKey: 'parent_id', as: 'parent'});

Article.hasMany(VisitorLog, {foreignKey: 'article_id', as: 'visitorLogs'});
VisitorLog.belongsTo(Article, {foreignKey: 'article_id', as: 'article'});

Article.hasMany(ArticleVersion, {foreignKey: 'article_id', as: 'versions'});
ArticleVersion.belongsTo(Article, {foreignKey: 'article_id', as: 'article'});

// 歌单关联
Playlist.hasMany(PlaylistSong, {foreignKey: 'playlist_id', as: 'playlistSongs'});
PlaylistSong.belongsTo(Playlist, {foreignKey: 'playlist_id', as: 'playlist'});
PlaylistSong.belongsTo(Music, {foreignKey: 'music_id', as: 'music'});
Music.hasMany(PlaylistSong, {foreignKey: 'music_id', as: 'playlistItems'});


async function syncDatabase() {
    try {
        await sequelize.authenticate();
        console.log('[MySQL] 连接已成功建立');
        await sequelize.sync();
        console.log('[MySQL] 模型已同步');
    } catch (err) {
        console.error('[MySQL] 连接失败:', err.message);
    }
}

module.exports = {
    sequelize,
    syncDatabase,
    ArticleTag,
    User,
    Article,
    Category,
    Tag,
    Comment,
    VisitorLog,
    Announcement,
    Link,
    ArticleVersion,
    Message,
    Subscriber,
    SiteConfig,
    MediaFile,
    Music,
    Playlist,
    PlaylistSong
};