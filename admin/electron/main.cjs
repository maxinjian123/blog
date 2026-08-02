// Electron 主进程
const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const { getApiBaseUrl, setApiBaseUrl, loadConfig } = require('./config.cjs');

// 开发环境判断：未打包且未强制加载 dist（用于本地验证打包产物）
const isDev = !app.isPackaged && !process.env.ELECTRON_LOAD_DIST;

let mainWindow = null;

/**
 * 静态资源反向代理：
 * Electron 页面通过 file:// 协议加载，相对路径（如 /uploads/xxx）会被解析为
 * file:///C:/uploads/xxx（带盘符的本地路径）导致 404。
 * 这里拦截 file:// 请求，将 /uploads/、/minio/api/ 前缀的请求重定向到后端地址。
 * 注：<img>/<video>/<audio>/<iframe> 标签资源加载为 no-cors 模式，跨域无限制。
 */
function setupAssetProxy() {
  // 注意：file:// 下 /uploads/xxx 实际解析为 file:///C:/uploads/xxx（带盘符），
  // URL pattern 中通配符对 file 协议的盘符匹配不可靠，故用 file://*/* 全量拦截，
  // 在回调内通过路径判断，非静态资源的请求直接放行。
  const filter = {
    urls: ['file://*/*']
  };

  session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return callback({});
    }
    const url = details.url;
    let idx = url.indexOf('/uploads/');
    let relative = null;
    if (idx !== -1) {
      relative = url.substring(idx);
    } else {
      idx = url.indexOf('/minio/api/');
      if (idx !== -1) {
        relative = url.substring(idx);
      }
    }
    if (!relative) {
      return callback({});
    }
    // 重定向到后端静态资源地址，如 http://192.168.1.100:3000/uploads/xxx.jpg
    callback({ redirectURL: `${baseUrl}${relative}` });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1800,
    height: 900,
    title: 'Blog管理后台',
    backgroundColor: '#f5f5f5',
    // 隐藏顶部菜单栏（按 Alt 可临时呼出）
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // 加载前端页面
  if (isDev) {
    // 开发模式：加载 vite dev server
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载构建产物
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // 外部链接用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 固定窗口标题为应用名「Blog管理后台」，不被前端页面 document.title 覆盖
  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC 处理：读取后端 API 地址
ipcMain.handle('config:getApiBaseUrl', () => {
  return getApiBaseUrl();
});

// IPC 处理：保存后端 API 地址
ipcMain.handle('config:setApiBaseUrl', (event, url) => {
  const ok = setApiBaseUrl(url);
  return ok;
});

// IPC 处理：读取完整配置
ipcMain.handle('config:getAll', () => {
  return loadConfig();
});

app.whenReady().then(() => {
  // 注册静态资源反向代理（拦截 file:// 下的 /uploads/、/minio/api/ 请求）
  setupAssetProxy();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
