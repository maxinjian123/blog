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
const OperationLog = require('./OperationLog')(sequelize);
const Emoji = require('./Emoji')(sequelize);
const EmojiPack = require('./EmojiPack')(sequelize);

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
        // 迁移：为 media_files 表补充新增字段（sync 不修改已存在表结构）
        await migrateMediaFileFields();
        // 迁移：为 articles 表补充新增字段（sync 不修改已存在表结构）
        await migrateArticleFields();
        // 迁移：自定义页面由数据库改为文件存储（backend/public），迁移后删除 client_pages 表
        await migrateClientPagesToFiles();
    } catch (err) {
        console.error('[MySQL] 数据库同步失败:', err.message);
    }
}

/**
 * 迁移：为 media_files 表添加图片抓取相关字段（如果不存在）
 * 仅 ALTER 缺失字段，不影响现有数据和其他表
 */
async function migrateMediaFileFields() {
    const newFields = [
        { name: 'author', def: 'VARCHAR(255) NULL', comment: '图片来源作者' },
        { name: 'source_url', def: 'VARCHAR(1000) NULL', comment: '图片来源页 URL' },
        { name: 'license', def: 'VARCHAR(100) NULL', comment: '授权信息' },
        { name: 'source_platform', def: 'VARCHAR(50) NULL', comment: '来源平台标识' }
    ];
    for (const f of newFields) {
        try {
            const [rows] = await sequelize.query(
                `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_files' AND COLUMN_NAME = '${f.name}'`
            );
            if (rows[0].cnt === 0) {
                await sequelize.query(
                    `ALTER TABLE media_files ADD COLUMN ${f.name} ${f.def} COMMENT '${f.comment}'`
                );
                console.log(`[MySQL] media_files 已添加字段: ${f.name}`);
            }
        } catch (err) {
            console.error(`[MySQL] 迁移字段 ${f.name} 失败:`, err.message);
        }
    }
}

async function migrateArticleFields() {
    const newFields = [
        { name: 'featured', def: 'TINYINT(1) NOT NULL DEFAULT 0', comment: '是否精选（首页精选展示）' },
        { name: 'source_platform', def: 'VARCHAR(50) NULL', comment: '文章来源平台标识' },
        { name: 'source_author', def: 'VARCHAR(200) NULL', comment: '文章原始作者' },
        { name: 'source_url', def: 'VARCHAR(1000) NULL', comment: '文章原始链接' },
        { name: 'source_license', def: 'VARCHAR(255) NULL', comment: '文章来源版权/授权说明' },
        { name: 'article_type', def: "ENUM('original','repost','translation') NOT NULL DEFAULT 'original'", comment: '文章类型：原创/转载/翻译' },
        { name: 'original_url', def: 'VARCHAR(1000) NULL', comment: '原文链接（转载/翻译时填写）' },
        { name: 'original_authorized', def: 'TINYINT(1) NOT NULL DEFAULT 0', comment: '原文允许转载/翻译或已获得授权' },
        { name: 'creation_declaration', def: "ENUM('none','ai_assisted','network_recompiled','personal_opinion') NOT NULL DEFAULT 'none'", comment: '创作声明' }
    ];
    for (const f of newFields) {
        try {
            const [rows] = await sequelize.query(
                `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'articles' AND COLUMN_NAME = '${f.name}'`
            );
            if (rows[0].cnt === 0) {
                await sequelize.query(
                    `ALTER TABLE articles ADD COLUMN ${f.name} ${f.def} COMMENT '${f.comment}'`
                );
                console.log(`[MySQL] articles 已添加字段: ${f.name}`);
            }
        } catch (err) {
            console.error(`[MySQL] 迁移字段 ${f.name} 失败:`, err.message);
        }
    }
}

/**
 * 迁移：自定义页面由数据库改为文件存储（backend/public/client-pages/<slug>/）
 * 将 client_pages 表中的数据写入对应文件（index.html / style.css / script.js），
 * 并注入 BlogAPI / BLOG_CONFIG 辅助脚本（若尚未包含），随后删除该表。
 * 若表不存在或为空则直接跳过。
 */
async function migrateClientPagesToFiles() {
    try {
        const [tables] = await sequelize.query(
            `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_pages'`
        );
        if (!tables || tables.length === 0) return;

        const [rows] = await sequelize.query('SELECT * FROM client_pages');
        if (rows && rows.length > 0) {
            const fs = require('fs');
            const path = require('path');
            const { buildBlogHelperScript } = require('../utils/clientPageTemplate');
            const root = path.resolve(__dirname, '..', 'public', 'client-pages');

            for (const row of rows) {
                if (!row.slug) continue;
                const dir = path.join(root, String(row.slug).trim());
                fs.mkdirSync(dir, {recursive: true});

                let html = row.html_content || '';
                // 注入 BlogAPI / BLOG_CONFIG 辅助脚本（若尚未包含）
                if (!html.includes('window.BlogAPI') && !html.includes('BlogAPI')) {
                    const inject = `<script>\n${buildBlogHelperScript()}\n</script>`;
                    const headEnd = html.lastIndexOf('</head>');
                    if (headEnd !== -1) {
                        html = html.slice(0, headEnd) + inject + html.slice(headEnd);
                    } else {
                        html = inject + '\n' + html;
                    }
                }
                // 补充 style.css 引用（若内容存在且页面未显式引用）
                if (row.css_content && !html.includes('style.css')) {
                    const link = '<link rel="stylesheet" href="style.css">';
                    const headEnd = html.lastIndexOf('</head>');
                    if (headEnd !== -1) {
                        html = html.slice(0, headEnd) + link + html.slice(headEnd);
                    } else {
                        html = link + '\n' + html;
                    }
                }
                // 补充 script.js 引用（若内容存在且页面未显式引用）
                if (row.js_content && !html.includes('script.js')) {
                    const script = '<script src="script.js"></script>';
                    const bodyEnd = html.lastIndexOf('</body>');
                    if (bodyEnd !== -1) {
                        html = html.slice(0, bodyEnd) + script + html.slice(bodyEnd);
                    } else {
                        html += '\n' + script;
                    }
                }
                fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
                if (row.css_content) fs.writeFileSync(path.join(dir, 'style.css'), row.css_content, 'utf8');
                if (row.js_content) fs.writeFileSync(path.join(dir, 'script.js'), row.js_content, 'utf8');
                console.log(`[MySQL] 自定义页面已迁移为文件: client-pages/${row.slug}`);
            }
        }

        await sequelize.query('DROP TABLE IF EXISTS client_pages');
        console.log('[MySQL] 已删除 client_pages 表（自定义页面改为文件存储）');
    } catch (err) {
        console.error('[MySQL] 迁移 client_pages 失败:', err.message);
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
    PlaylistSong,
    OperationLog,
    Emoji,
    EmojiPack
};
