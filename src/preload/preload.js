const {contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('formApi', {
    openForm: () => ipcRenderer.invoke('openForm'),
})

contextBridge.exposeInMainWorld('interfaceApi', {
    addTorrentToList: (callback) => ipcRenderer.on('addTorrentToList', callback)
})
