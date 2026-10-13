const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const SITE_URL = 'https://vshshsg229-hash.github.io/kh-kozak-pubg/';
function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 800, minHeight: 600,
    title: 'KH Kozak Gaming Hub',
    autoHideMenuBar: true,
    backgroundColor: '#090b12',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadURL(SITE_URL);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    return { action: 'deny' };
  });
}
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
