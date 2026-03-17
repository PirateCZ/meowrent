const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('dialogApi', {
    openFiles: (extensions) => ipcRenderer.invoke('openFiles', extensions),
    openFolder: () => ipcRenderer.invoke('openFolder'),
    getDownloadsFolder: () => ipcRenderer.invoke('getDownloadsFolder')
})

contextBridge.exposeInMainWorld('torrentApi', {
    downloadTorrent: (
	saveLocation, fileList, linkList, startTorrent, hashCheck
    ) => ipcRenderer.invoke('downloadTorrent', 
	saveLocation, fileList, linkList, startTorrent, hashCheck
    ),

    createTorrent: (
	itemsToUpload, torrentName, trackerURLs, torrentComment, pieceLength, privateTorrent, startSeeding
    ) => ipcRenderer.invoke('createTorrent', 
	itemsToUpload, torrentName, trackerURLs, torrentComment, pieceLength, privateTorrent, startSeeding
    ),
})

contextBridge.exposeInMainWorld('themeApi', {
    loadSettings: () => ipcRenderer.invoke('loadSettings')
})
