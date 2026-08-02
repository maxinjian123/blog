// Electron 桌面端配置管理：
// 随包分发的 .env.production（asar 内只读）作为模板，
// 首次启动复制到 userData 目录作为可写副本，之后所有读写均针对该副本。
// 字段语义：
//   VUE_APP_API_URL      — 客户端访问地址（站点根，如 http://ip:3000）
//   VUE_APP_BACKEND_URL  — 后端 API 地址（桌面端连接后端用，如 http://192.168.48.1:3000）
// 管理端修改任一字段时直接写入该副本文件，实现真正动态修改 .env.production。
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// 根据运行环境选择环境文件名
function getEnvFileName() {
  return app.isPackaged || process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
}

// asar 内的只读模板路径
function getTemplateEnvPath() {
  return path.join(__dirname, '..', getEnvFileName());
}

// userData 内的可写副本路径
function getWritableEnvPath() {
  return path.join(app.getPath('userData'), getEnvFileName());
}

// 旧版配置文件路径（用于一次性迁移）
function getLegacyConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

// 解析简易 .env 文件（KEY=VALUE），不引入额外依赖
function parseEnvFile(filePath) {
  const env = {};
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex <= 0) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // 去掉成对引号
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  } catch (err) {
    if (!app.isPackaged) {
      console.warn('[config] 读取环境文件失败:', err.message);
    }
  }
  return env;
}

// 序列化 env 对象为 .env 文本（保持 KEY=VALUE 格式）
function stringifyEnv(env) {
  return Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
}

// 一次性迁移：将旧版 config.json 中的 apiBaseUrl 合并到 .env.production 副本
// 旧 config.json 的 apiBaseUrl 是后端 API 地址，应迁移到 VUE_APP_BACKEND_URL
function migrateFromLegacyConfig(envPath) {
  try {
    const legacyPath = getLegacyConfigPath();
    if (!fs.existsSync(legacyPath)) return;
    const old = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));
    if (old.apiBaseUrl) {
      const env = parseEnvFile(envPath);
      env.VUE_APP_BACKEND_URL = old.apiBaseUrl;
      fs.writeFileSync(envPath, stringifyEnv(env), 'utf-8');
    }
    // 迁移完成后删除旧配置文件，避免下次重复迁移
    fs.unlinkSync(legacyPath);
    if (!app.isPackaged) {
      console.log('[config] 已从旧 config.json 迁移 apiBaseUrl 至 VUE_APP_BACKEND_URL');
    }
  } catch (err) {
    // 迁移失败静默处理，不影响启动
    if (!app.isPackaged) {
      console.warn('[config] 旧配置迁移失败:', err.message);
    }
  }
}

// 同步副本字段：以模板为基准补全副本中缺失的字段。
// 针对 VUE_APP_BACKEND_URL 缺失的旧副本（升级场景），将 VUE_APP_API_URL 的污染值
// 迁移到 VUE_APP_BACKEND_URL，并从模板恢复 VUE_APP_API_URL 为正确的客户端地址。
function syncEnvFromTemplate(envPath) {
  try {
    const templateEnv = parseEnvFile(getTemplateEnvPath());
    const env = parseEnvFile(envPath);
    let changed = false;

    // 旧版本升级：副本缺 VUE_APP_BACKEND_URL，且 VUE_APP_API_URL 被污染为后端地址
    if (!env.VUE_APP_BACKEND_URL && env.VUE_APP_API_URL) {
      env.VUE_APP_BACKEND_URL = env.VUE_APP_API_URL;
      if (templateEnv.VUE_APP_API_URL) {
        env.VUE_APP_API_URL = templateEnv.VUE_APP_API_URL;
      }
      changed = true;
      if (!app.isPackaged) {
        console.log('[config] 检测到旧版副本，已将 VUE_APP_API_URL 迁移至 VUE_APP_BACKEND_URL 并恢复客户端地址');
      }
    }

    // 补全其他缺失字段（不影响已有字段）
    for (const [k, v] of Object.entries(templateEnv)) {
      if (env[k] === undefined || env[k] === '') {
        env[k] = v;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(envPath, stringifyEnv(env), 'utf-8');
    }
  } catch (err) {
    if (!app.isPackaged) {
      console.warn('[config] 同步模板字段失败:', err.message);
    }
  }
}

// 确保可写副本存在：首次启动从 asar 模板复制到 userData
function ensureEnvCopy() {
  const writablePath = getWritableEnvPath();
  if (!fs.existsSync(writablePath)) {
    try {
      const templatePath = getTemplateEnvPath();
      const content = fs.readFileSync(templatePath, 'utf-8');
      fs.writeFileSync(writablePath, content, 'utf-8');
      // 首次创建时尝试迁移旧版 config.json
      migrateFromLegacyConfig(writablePath);
    } catch (err) {
      console.error('[config] 创建环境文件副本失败:', err.message);
    }
  } else {
    // 副本已存在：同步模板新增字段并修复旧版污染
    syncEnvFromTemplate(writablePath);
  }
  return writablePath;
}

// 读取当前生效的 env（userData 可写副本）
function loadEnv() {
  ensureEnvCopy();
  return parseEnvFile(getWritableEnvPath());
}

// 写入单个 env 字段到可写副本（保留其他字段）
function setEnvKey(key, value) {
  ensureEnvCopy();
  const env = parseEnvFile(getWritableEnvPath());
  env[key] = value;
  try {
    fs.writeFileSync(getWritableEnvPath(), stringifyEnv(env), 'utf-8');
    return true;
  } catch (err) {
    console.error('[config] 写入环境文件失败:', err.message);
    return false;
  }
}

// 读取完整配置（兼容旧接口，返回 env 字段 + apiBaseUrl/clientUrl 别名）
function loadConfig() {
  const env = loadEnv();
  return {
    ...env,
    apiBaseUrl: env.VUE_APP_BACKEND_URL || '',
    clientUrl: env.VUE_APP_API_URL || '',
    updatedAt: null
  };
}

// 后端 API 地址（VUE_APP_BACKEND_URL）
function getApiBaseUrl() {
  return loadEnv().VUE_APP_BACKEND_URL || '';
}

function setApiBaseUrl(url) {
  return setEnvKey('VUE_APP_BACKEND_URL', url);
}

// 客户端访问地址（VUE_APP_API_URL）
function getClientUrl() {
  return loadEnv().VUE_APP_API_URL || '';
}

function setClientUrl(url) {
  return setEnvKey('VUE_APP_API_URL', url);
}

module.exports = {
  ensureEnvCopy,
  loadEnv,
  setEnvKey,
  getApiBaseUrl,
  setApiBaseUrl,
  getClientUrl,
  setClientUrl,
  loadConfig,
  getWritableEnvPath
};
