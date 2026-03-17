const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('darkModeApi', {
    toggleDarkMode: () => ipcRenderer.invoke("toggleDarkMode"),
}) 

contextBridge.exposeInMainWorld('jsonApi', {
    saveSettingsToJSON: (settings) => ipcRenderer.invoke("saveSettingsToJSON", settings),
    loadSettings: () => ipcRenderer.invoke("loadSettings"),
})

contextBridge.exposeInMainWorld('themeApi', {
    changeMainWindowColor: (primaryColor, secondaryColor) => ipcRenderer.invoke("changeMainWindowColor", primaryColor, secondaryColor),
    themeCircleContextMenu: (circleNumber) => ipcRenderer.invoke("themeCircleContextMenu", circleNumber),
    deleteTheme: (callback) => ipcRenderer.on("deleteTheme", callback)
})
