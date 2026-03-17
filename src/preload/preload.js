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
    
    // Torrent update listeners
    updateTorrentProgress: (callback) => ipcRenderer.on('updateTorrentProgress', callback),
    updateTorrentSpeed: (callback) => ipcRenderer.on('updateTorrentSpeed', callback),
    updateTorrentPeers: (callback) => ipcRenderer.on('updateTorrentPeers', callback),
    updateTorrentStatus: (callback) => ipcRenderer.on('updateTorrentStatus', callback),
    updateTorrentName: (callback) => ipcRenderer.on('updateTorrentName', callback),
    updateTorrentSize: (callback) => ipcRenderer.on('updateTorrentSize', callback),
    updateTorrentData: (callback) => ipcRenderer.on('updateTorrentData', callback),
    removeTorrentFromList: (callback) => ipcRenderer.on('removeTorrentFromList', callback),
})

contextBridge.exposeInMainWorld('onLoad', {
    loadSettings: () => ipcRenderer.invoke('loadSettings')
})
