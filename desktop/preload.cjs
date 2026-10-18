const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("KozakDesktop", Object.freeze({
  getInstalledApps: () => ipcRenderer.invoke("kozak:apps:list"),
  launchApp: (id) => ipcRenderer.invoke("kozak:apps:launch", id),
  openStore: (query) => ipcRenderer.invoke("kozak:apps:store", String(query || "").slice(0, 120)),
  openExternal: (url) => ipcRenderer.invoke("kozak:external:open", String(url || ""))
}));
