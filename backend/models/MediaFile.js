const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MediaFile = sequelize.define('MediaFile', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '存储文件名（含扩展名）'
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '原始文件名'
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '文件大小（字节）'
    },
    storage: {
      type: DataTypes.ENUM('local', 'minio'),
      defaultValue: 'local',
      comment: '存储源：local 本地 / minio 对象存储'
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '访问 URL'
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '存储路径（本地相对路径或 MinIO object key）'
    },
    author: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '图片来源作者（抓取自外部平台，用于版权标注）'
    },
    source_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      comment: '图片来源页 URL（抓取自外部平台，用于版权标注）'
    },
    license: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '授权信息（如 CC0、Pixabay License 等）'
    },
    source_platform: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '来源平台标识：bing / dogetu，留空表示用户上传'
    }
  }, {
    tableName: 'media_files',
    timestamps: true,
    underscored: true
  });

  return MediaFile;
};
