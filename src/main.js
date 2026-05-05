const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: '#f7f5ef',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function sendUpdateStatus(message) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', message);
  }
}

function configureAutoUpdater() {
  autoUpdater.autoDownload = true;

  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus('Buscando actualizaciones...');
  });

  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus(`Actualizacion disponible: ${info.version}. Descargando...`);
  });

  autoUpdater.on('update-not-available', () => {
    sendUpdateStatus('La aplicacion ya esta actualizada.');
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus(`Descargando actualizacion: ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    sendUpdateStatus(`Version ${info.version} descargada. Reinicia para instalar.`);

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['Reiniciar ahora', 'Despues'],
      defaultId: 0,
      cancelId: 1,
      title: 'Actualizacion lista',
      message: `La version ${info.version} ya se descargo.`,
      detail: 'Para instalarla, la aplicacion debe cerrarse y abrirse de nuevo.'
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (error) => {
    sendUpdateStatus(`Error de actualizacion: ${error.message}`);
  });
}

app.whenReady().then(() => {
  createWindow();
  configureAutoUpdater();

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  } else {
    sendUpdateStatus('Auto-update desactivado en modo desarrollo.');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('app:get-version', () => app.getVersion());

ipcMain.handle('app:check-updates', async () => {
  if (!app.isPackaged) {
    return 'Las actualizaciones solo se prueban en la app instalada.';
  }

  await autoUpdater.checkForUpdatesAndNotify();
  return 'Revision de actualizaciones iniciada.';
});
