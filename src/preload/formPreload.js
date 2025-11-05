const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('dialogApi', {
    openDialog: () => ipcRenderer.invoke('openDialog'),
})
