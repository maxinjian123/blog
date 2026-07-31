const {DataTypes} = require('sequelize');

module.exports = (sequelize) => {
  const PlaylistSong = sequelize.define('PlaylistSong', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    playlist_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: '歌单 ID'
    },
    music_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: '音乐 ID'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序权重（越小越靠前）'
    }
  }, {
    tableName: 'playlist_songs',
    timestamps: true,
    underscored: true
  });

  return PlaylistSong;
};
