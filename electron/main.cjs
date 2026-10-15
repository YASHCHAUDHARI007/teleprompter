const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let floatingOverlayWindow = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0b0f17',
    title: 'PromptStudio — Professional Teleprompter & Camera Recording Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for custom preload bridge with fs/dialog access via IPC
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (floatingOverlayWindow) {
      floatingOverlayWindow.close();
    }
  });
}

function createFloatingOverlayWindow() {
  if (floatingOverlayWindow) {
    if (floatingOverlayWindow.isVisible()) {
      floatingOverlayWindow.hide();
    } else {
      floatingOverlayWindow.show();
    }
    return;
  }

  floatingOverlayWindow = new BrowserWindow({
    width: 640,
    height: 480,
    minWidth: 320,
    minHeight: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: true,
    backgroundColor: '#00000000', // Actual OS-level transparent alpha channel
    title: 'PromptStudio Floating Teleprompter',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const overlayUrl = isDev
    ? 'http://localhost:5173?mode=floating'
    : `file://${path.join(__dirname, '../dist/index.html')}?mode=floating`;

  floatingOverlayWindow.loadURL(overlayUrl);

  floatingOverlayWindow.on('closed', () => {
    floatingOverlayWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('desktop:get-desktop-path', async () => {
  return app.getPath('desktop');
});

ipcMain.handle('desktop:choose-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Destination Folder for Video Recordings',
    defaultPath: app.getPath('desktop'),
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  return { success: true, dirPath: result.filePaths[0] };
});

ipcMain.handle('desktop:save-video', async (_event, { buffer, fileName, subfolder }) => {
  try {
    if (!buffer || !fileName) {
      return { success: false, error: 'Invalid recording buffer or filename' };
    }

    // Sanitize fileName to prevent directory traversal
    const safeFileName = path.basename(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_');

    // Default directory: Desktop or PromptStudio folder on Desktop
    const desktopPath = app.getPath('desktop');
    const targetDir = subfolder
      ? path.join(desktopPath, subfolder)
      : path.join(desktopPath, 'PromptStudio_Recordings');

    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, safeFileName);

    // Write chunked buffer to disk
    await fs.promises.writeFile(filePath, Buffer.from(buffer));

    return {
      success: true,
      filePath,
    };
  } catch (err) {
    console.error('Failed to write video file in Electron main:', err);
    return {
      success: false,
      error: err.message || 'File system write failed',
    };
  }
});

ipcMain.handle('desktop:open-in-folder', async (_event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

ipcMain.handle('desktop:toggle-floating-overlay', async (_event, options) => {
  createFloatingOverlayWindow();
  return true;
});

ipcMain.handle('desktop:set-click-through', async (_event, enabled) => {
  if (floatingOverlayWindow) {
    floatingOverlayWindow.setIgnoreMouseEvents(enabled, { forward: true });
  }
});

ipcMain.handle('desktop:set-always-on-top', async (_event, enabled) => {
  if (floatingOverlayWindow) {
    floatingOverlayWindow.setAlwaysOnTop(enabled, 'screen-saver');
  }
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
