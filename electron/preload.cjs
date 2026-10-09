const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('promptStudioDesktop', {
  isElectron: true,

  saveVideoToDesktop: (options) => {
    return ipcRenderer.invoke('desktop:save-video', options);
  },

  chooseDirectory: () => {
    return ipcRenderer.invoke('desktop:choose-directory');
  },

  getDesktopPath: () => {
    return ipcRenderer.invoke('desktop:get-desktop-path');
  },

  openPathInFolder: (filePath) => {
    return ipcRenderer.invoke('desktop:open-in-folder', filePath);
  },

  toggleFloatingOverlay: (options) => {
    return ipcRenderer.invoke('desktop:toggle-floating-overlay', options);
  },

  setClickThrough: (enabled) => {
    return ipcRenderer.invoke('desktop:set-click-through', enabled);
  },

  setAlwaysOnTop: (enabled) => {
    return ipcRenderer.invoke('desktop:set-always-on-top', enabled);
  },

  syncPrompterState: (state) => {
    ipcRenderer.send('prompter:sync-state', state);
  },

  onPrompterCommand: (callback) => {
    const handler = (_event, command, payload) => callback(command, payload);
    ipcRenderer.on('prompter:command', handler);
    return () => ipcRenderer.removeListener('prompter:command', handler);
  },
});
