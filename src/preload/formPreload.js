const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('dialogApi', {
    openFiles: () => ipcRenderer.invoke('openFiles'),
    openFolder: () => ipcRenderer.invoke('openFolder'),
    getDownloadsFolder: () => ipcRenderer.invoke('getDownloadsFolder')
})

contextBridge.exposeInMainWorld('torrentApi', {
    downloadTorrent: (saveLocation, fileList, linkList, startTorrent, topQueue, hashCheck) => ipcRenderer.invoke('downloadTorrent', saveLocation, fileList, linkList, startTorrent, topQueue, hashCheck),
})
