const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('chatApp', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  checkUpdates: () => ipcRenderer.invoke('app:check-updates'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (_event, message) => callback(message));
  }
});
