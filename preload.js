const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('pathApi', {
    getHomePath: () => ipcRenderer.invoke('getHomePath'),
    changePath: (path, name) => ipcRenderer.invoke('changePath', path, name),
})

contextBridge.exposeInMainWorld('fileApi', {
    getFiles: (path) => ipcRenderer.invoke('getFiles', path),
    openApp: (path, name) => ipcRenderer.invoke('openApp', path, name),
    getIcon: (file) => ipcRenderer.invoke('getIcon', file),
})

contextBridge.exposeInMainWorld('themeApi', {
    toggleDarkMode: () => ipcRenderer.invoke('toggleDarkMode'),
    systemTheme: () => ipcRenderer.invoke('systemTheme'),
})

contextBridge.exposeInMainWorld('menuApi', {
    showContextMenu: () => ipcRenderer.invoke('showContextMenu')
})
