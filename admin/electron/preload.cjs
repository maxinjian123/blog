// Electron preload：在隔离的上下文中向渲染进程暴露安全的 API
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 读取后端 API 地址
  getApiBaseUrl: () => ipcRenderer.invoke('config:getApiBaseUrl'),
  // 保存后端 API 地址
  setApiBaseUrl: (url) => ipcRenderer.invoke('config:setApiBaseUrl', url),
  // 读取完整配置
  getAllConfig: () => ipcRenderer.invoke('config:getAll'),
  // 是否为 Electron 桌面端环境
  isElectron: true,
  // 应用版本
  appVersion: process.env.npm_package_version || '1.0.0'
});
