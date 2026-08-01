const {DataTypes} = require('sequelize');

module.exports = (sequelize) => {
  const OperationLog = sequelize.define('OperationLog', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      comment: '操作者 ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作者用户名（冗余字段，便于查询）'
    },
    module: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '操作模块：article/comment/link/media/music/playlist/announcement/config/user/auth 等'
    },
    action: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '操作类型：create/update/delete/publish/audit/login 等'
    },
    target_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      comment: '操作目标 ID'
    },
    target_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '操作目标名称/摘要（如文章标题）'
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'HTTP 方法'
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '请求路径'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作 IP'
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'User-Agent'
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'success',
      comment: '操作状态：success / fail'
    },
    status_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'HTTP 状态码'
    },
    error_msg: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息（失败时记录）'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '请求耗时（毫秒）'
    },
    request_body: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '请求参数（脱敏后 JSON，限 2KB）'
    }
  }, {
    tableName: 'operation_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false  // 操作日志只有创建时间，不需要更新时间
  });

  return OperationLog;
};
