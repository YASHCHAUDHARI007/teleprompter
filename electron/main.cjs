const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');

let ffmpegPath = null;
try {
  ffmpegPath = require('ffmpeg-static');
} catch (e) {
  console.warn('ffmpeg-static could not be loaded directly:', e);
}

let mainWindow = null;
let floatingOverlayWindow = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#111214',
    title: 'PromptStudio — Professional Teleprompter & Camera Recording Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
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
    backgroundColor: '#00000000',
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

// Convert source recording to real H.264 / AAC MP4 using bundled FFmpeg
function convertBufferToMp4(inputBuffer, outputFilePath) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
      return reject(new Error('Bundled FFmpeg executable not found'));
    }

    const tempInput = path.join(
      os.tmpdir(),
      `promptstudio_raw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.tmp`
    );

    fs.writeFile(tempInput, Buffer.from(inputBuffer), (writeErr) => {
      if (writeErr) {
        return reject(new Error('Failed to write temporary recording file: ' + writeErr.message));
      }

      // Exact production-grade parameters requested:
      // -map 0:v -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -map 0:a? -c:a aac -b:a 192k -movflags +faststart
      const args = [
        '-y',
        '-i', tempInput,
        '-map', '0:v',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '22',
        '-pix_fmt', 'yuv420p',
        '-map', '0:a?',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        outputFilePath,
      ];

      execFile(ffmpegPath, args, { maxBuffer: 15 * 1024 * 1024 }, (err, stdout, stderr) => {
        // Clean up temporary raw recording
        fs.unlink(tempInput, () => {});

        if (err) {
          console.error('FFmpeg MP4 conversion error:', stderr);
          return reject(new Error('FFmpeg conversion failed: ' + (err.message || stderr)));
        }

        if (!fs.existsSync(outputFilePath)) {
          return reject(new Error('FFmpeg completed but output file not found'));
        }

        const stat = fs.statSync(outputFilePath);
        if (stat.size === 0) {
          return reject(new Error('Generated MP4 file is empty'));
        }

        resolve({
          filePath: outputFilePath,
          size: stat.size,
        });
      });
    });
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

ipcMain.handle('desktop:show-save-dialog', async (_event, defaultFileName) => {
  const defaultPath = path.join(app.getPath('desktop'), defaultFileName || 'PromptStudio_Recording.mp4');
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Recording as MP4',
    defaultPath,
    filters: [
      { name: 'MP4 Video (*.mp4)', extensions: ['mp4'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('desktop:convert-and-save-mp4', async (_event, { buffer, fileName, targetPath, subfolder }) => {
  try {
    if (!buffer || buffer.length === 0) {
      return { success: false, error: 'Empty video recording buffer' };
    }

    let safeFileName = path.basename(fileName || 'PromptStudio_Recording.mp4').replace(/[^a-zA-Z0-9_.-]/g, '_');
    if (!safeFileName.toLowerCase().endsWith('.mp4')) {
      safeFileName = safeFileName.replace(/\.[a-zA-Z0-9]+$/, '') + '.mp4';
    }

    let finalFilePath = targetPath;
    if (!finalFilePath) {
      const desktopPath = app.getPath('desktop');
      const targetDir = subfolder
        ? path.join(desktopPath, subfolder)
        : path.join(desktopPath, 'PromptStudio_Recordings');

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      finalFilePath = path.join(targetDir, safeFileName);
    }

    const { filePath, size } = await convertBufferToMp4(buffer, finalFilePath);

    return {
      success: true,
      filePath,
      fileName: path.basename(filePath),
      size,
    };
  } catch (err) {
    console.error('Failed to convert and save MP4 in Electron:', err);
    return {
      success: false,
      error: err.message || 'MP4 encoding failed',
    };
  }
});

ipcMain.handle('desktop:save-video', async (_event, { buffer, fileName, subfolder }) => {
  try {
    if (!buffer || !fileName) {
      return { success: false, error: 'Invalid recording buffer or filename' };
    }

    let safeFileName = path.basename(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_');
    if (!safeFileName.toLowerCase().endsWith('.mp4')) {
      safeFileName = safeFileName.replace(/\.[a-zA-Z0-9]+$/, '') + '.mp4';
    }

    const desktopPath = app.getPath('desktop');
    const targetDir = subfolder
      ? path.join(desktopPath, subfolder)
      : path.join(desktopPath, 'PromptStudio_Recordings');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, safeFileName);
    await fs.promises.writeFile(filePath, Buffer.from(buffer));

    const stat = fs.statSync(filePath);
    return {
      success: true,
      filePath,
      fileName: safeFileName,
      size: stat.size,
    };
  } catch (err) {
    console.error('Failed to write video file in Electron main:', err);
    return {
      success: false,
      error: err.message || 'File system write failed',
    };
  }
});

ipcMain.handle('desktop:read-file-buffer', async (_event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }
    const data = await fs.promises.readFile(filePath);
    return { success: true, buffer: data };
  } catch (e) {
    return { success: false, error: e.message };
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
