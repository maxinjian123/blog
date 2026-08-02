// Electron 桌面端配置管理：读写用户目录下的 config.json
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

let cachedConfig = null;

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function getDefaultConfig() {
  return {
    apiBaseUrl: '', // 后端 API 地址，如 http://192.168.1.100:3000
    updatedAt: null
  };
}

function loadConfig() {
  if (cachedConfig) return cachedConfig;
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      cachedConfig = { ...getDefaultConfig(), ...JSON.parse(raw) };
    } else {
      cachedConfig = getDefaultConfig();
    }
  } catch (err) {
    console.error('[config] 加载配置失败:', err.message);
    cachedConfig = getDefaultConfig();
  }
  return cachedConfig;
}

function saveConfig(updates) {
  const config = loadConfig();
  cachedConfig = { ...config, ...updates, updatedAt: Date.now() };
  const configPath = getConfigPath();
  try {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(cachedConfig, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[config] 保存配置失败:', err.message);
    return false;
  }
}

function getApiBaseUrl() {
  return loadConfig().apiBaseUrl || '';
}

function setApiBaseUrl(url) {
  return saveConfig({ apiBaseUrl: url });
}

module.exports = {
  loadConfig,
  saveConfig,
  getApiBaseUrl,
  setApiBaseUrl,
  getConfigPath
};
