const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('dialogApi', {
    openFiles: (extensions) => ipcRenderer.invoke('openFiles', extensions),
    openFolder: () => ipcRenderer.invoke('openFolder'),
    getDownloadsFolder: () => ipcRenderer.invoke('getDownloadsFolder')
})

contextBridge.exposeInMainWorld('torrentApi', {
    downloadTorrent: (
	saveLocation, fileList, linkList, startTorrent, topQueue, hashCheck
    ) => ipcRenderer.invoke('downloadTorrent', 
	saveLocation, fileList, linkList, startTorrent, topQueue, hashCheck
    ),

    createTorrent: (
	itemsToUpload, torrentName, trackerURLs, torrentComment, pieceLength, privateTorrent, startSeeding
    ) => ipcRenderer.invoke('createTorrent', 
	itemsToUpload, torrentName, trackerURLs, torrentComment, pieceLength, privateTorrent, startSeeding
    ),
})
