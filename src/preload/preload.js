const {contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('formApi', {
    openForm: () => ipcRenderer.invoke('openForm'),
})
