const {contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('windowApi', {
    openForm: () => ipcRenderer.invoke('openForm'),
    openSettings: () => ipcRenderer.invoke('openSettings'),
})

contextBridge.exposeInMainWorld('interfaceApi', {
    addTorrentToList: (callback) => ipcRenderer.on('addTorrentToList', callback),
    changeDownloadProgress: (callback) => ipcRenderer.on('changeDownloadProgress', callback),
    changeThemeColors: (callback) => ipcRenderer.on('changeThemeColors', callback),
    setLightnesMode: (theme) => ipcRenderer.invoke('setLightnesMode', theme),
})

contextBridge.exposeInMainWorld('onLoad', {
    loadSettings: () => ipcRenderer.invoke('loadSettings')
})
