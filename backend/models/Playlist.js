const {DataTypes} = require('sequelize');

module.exports = (sequelize) => {
  const Playlist = sequelize.define('Playlist', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '歌单名称'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '歌单描述'
    },
    cover: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '歌单封面图 URL'
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否公开访问'
    },
    share_code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      comment: '分享码（用于公开访问链接）'
    },
    play_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '播放次数'
    }
  }, {
    tableName: 'playlists',
    timestamps: true,
    underscored: true
  });

  return Playlist;
};
