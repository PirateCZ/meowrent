const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('darkModeApi', {
    toggleDarkMode: () => ipcRenderer.invoke("toggleDarkMode"),
}) 

contextBridge.exposeInMainWorld('jsonApi', {
    saveSettingsToJSON: (settings) => ipcRenderer.invoke("saveSettingsToJSON", settings),
    loadSettings: () => ipcRenderer.invoke("loadSettings"),
})

contextBridge.exposeInMainWorld('fileApi', {
    selectFolder: () => ipcRenderer.invoke("openFolder"),
    getDefaultDownloadsFolder: () => ipcRenderer.invoke("getDownloadsFolder"),
    exportSettings: (settings) => ipcRenderer.invoke("exportSettings", settings),
})

contextBridge.exposeInMainWorld('themeApi', {
    changeMainWindowColor: (primaryColor, secondaryColor) => ipcRenderer.invoke("changeMainWindowColor", primaryColor, secondaryColor),
    themeCircleContextMenu: (circleNumber) => ipcRenderer.invoke("themeCircleContextMenu", circleNumber),
    deleteTheme: (callback) => ipcRenderer.on("deleteTheme", callback)
})

contextBridge.exposeInMainWorld('dialogApi', {
    confirm: (title, message) => ipcRenderer.invoke("showConfirmDialog", title, message),
})

contextBridge.exposeInMainWorld('startupApi', {
    updateStartOnLaunch: (enabled) => ipcRenderer.invoke("updateStartOnLaunch", enabled),
})
