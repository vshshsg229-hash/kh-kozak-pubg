const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

let shortcutMap = new Map();

function collectShortcuts(root, out, depth = 0) {
  if (!root || depth > 5 || out.length > 2500) return;
  let entries;
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      collectShortcuts(fullPath, out, depth + 1);
      continue;
    }
    if (!entry.isFile() || !/\.(lnk|url|appref-ms)$/i.test(entry.name)) continue;
    out.push({ id: fullPath, label: path.basename(entry.name, path.extname(entry.name)), path: fullPath });
    if (out.length > 2500) return;
  }
}

function listInstalledApps() {
  const entries = [];
  const roots = [
    path.join(app.getPath("appData"), "Microsoft", "Windows", "Start Menu", "Programs"),
    path.join(process.env.ProgramData || "C:\\ProgramData", "Microsoft", "Windows", "Start Menu", "Programs"),
    path.join(app.getPath("home"), "Desktop"),
    path.join(app.getPath("appData"), "Microsoft", "Internet Explorer", "Quick Launch", "User Pinned", "TaskBar")
  ];
  for (const root of roots) collectShortcuts(root, entries);
  const unique = new Map();
  for (const item of entries) unique.set(item.path.toLowerCase(), item);
  shortcutMap = new Map([...unique.values()].map(item => [item.id, item.path]));
  return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label, "uk"));
}

ipcMain.handle("kozak:apps:list", () => listInstalledApps());
ipcMain.handle("kozak:apps:launch", async (_event, id) => {
  if (typeof id !== "string" || !shortcutMap.has(id)) return { ok: false, error: "unknown-app" };
  const target = shortcutMap.get(id);
  try {
    const error = await shell.openPath(target);
    return error ? { ok: false, error } : { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});
ipcMain.handle("kozak:apps:store", async (_event, query) => {
  const safeQuery = String(query || "").trim().slice(0, 120);
  if (!safeQuery) return { ok: false };
  await shell.openExternal("https://apps.microsoft.com/search?query=" + encodeURIComponent(safeQuery));
  return { ok: true };
});
ipcMain.handle("kozak:external:open", async (_event, url) => {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return { ok: false };
    await shell.openExternal(parsed.href);
    return { ok: true };
  } catch { return { ok: false }; }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 620,
    title: `KOZAK NEXUS ${app.getVersion()}`,
    autoHideMenuBar: true,
    backgroundColor: "#090b12",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadFile(path.join(__dirname, "web", "index.html"), { query: { desktopVersion: app.getVersion() } });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
