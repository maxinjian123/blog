const {DataTypes} = require('sequelize');

module.exports = (sequelize) => {
  const Music = sequelize.define('Music', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    song_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '歌曲 ID（网易云 songId 或上传生成的 ID）'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '歌曲名'
    },
    singer: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '歌手'
    },
    album: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '专辑名'
    },
    cover: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '封面图 URL'
    },
    play_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '播放地址（M4A/MP3）'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '时长（秒）'
    },
    source: {
      type: DataTypes.STRING(20),
      defaultValue: 'qq',
      comment: '存储源：local / minio / qq（旧数据兼容）'
    },
    origin_platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'netease',
      comment: '原始来源平台：netease 网易云 / qq QQ音乐 / upload 手动上传'
    },
    playlist_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '导入来源歌单名'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序权重（越小越靠前）'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用'
    },
    lyric: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'LRC 歌词文本'
    }
  }, {
    tableName: 'musics',
    timestamps: true,
    underscored: true
  });

  return Music;
};
