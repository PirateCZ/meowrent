const { app, BrowserWindow, ipcMain, dialog, nativeTheme, Menu, MenuItem, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { open } = require('node:fs/promises')
let mainWindow = undefined
let formWindow = undefined
let settingsWindow = undefined
let themeMenu = undefined

import WebTorrent from "webtorrent";
const client = new WebTorrent(
    {
	dht: true,
	utp: false,
    }
)

// Track active torrents and their update intervals
const torrentIntervals = new Map()

// Track torrents that are being added
const pendingTorrents = new Set()

console.log('Setting up client listeners...')

// Listen for any error on the client
client.on('error', (err) => {
    console.error('Client error:', err)
})

console.log('✓ Client listeners initialized')

// Utility function to format bytes
const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Function to start updating a torrent every second
const startTorrentUpdates = (torrent) => {
    const torrentId = torrent.infoHash
    console.log('Starting updates for torrent:', torrentId)
    
    // Clear any existing interval for this torrent
    if (torrentIntervals.has(torrentId)) {
        clearInterval(torrentIntervals.get(torrentId))
    }

    // Set up update interval
    const updateInterval = setInterval(() => {
        if (!mainWindow || !mainWindow.webContents) {
            console.warn('Skip update - mainWindow not available')
            return
        }

        const progress = Math.round(torrent.progress * 100)
        const speed = torrent.downloadSpeed
        const connectedPeers = torrent.numPeers || 0
        const totalPeers = torrent.discovered || 0
        const speedFormatted = formatBytes(speed, 0) + '/s'
        const size = torrent.length ? formatBytes(torrent.length) : 'Výpočet...'

        let status = 'Čekání'
        if (torrent.paused) {
            status = 'Pozastaveno'
        } else if (progress === 100) {
            status = 'Sdílení'
        } else if (speed > 0) {
            status = 'Stahování'
        } else if (connectedPeers > 0) {
            status = 'Připojování'
        }

        // Send batch update
        mainWindow.webContents.send('updateTorrentData', torrentId, {
            progress,
            speed: speedFormatted,
            peers: `${connectedPeers} (${totalPeers})`,
            size,
            status
        })
    }, 1000) // Update every second

    torrentIntervals.set(torrentId, updateInterval)
}

// Function to stop updating a torrent
const stopTorrentUpdates = (torrentId) => {
    if (torrentIntervals.has(torrentId)) {
        clearInterval(torrentIntervals.get(torrentId))
        torrentIntervals.delete(torrentId)
    }
}

// Function to load torrent history from history.json
const loadTorrentHistory = async () => {
    try {
        const historyFile = await open(path.join(app.getAppPath(), 'history.json'), 'r')
        const historyContent = await historyFile.readFile('utf-8')
        historyFile.close()
        const history = JSON.parse(historyContent)
        return history.torrents || []
    } catch (error) {
        console.error('Error loading torrent history:', error)
        return []
    }
}

// Function to add a torrent to history
const addTorrentToHistory = async (torrentName, magnetLink) => {
    try {
        let history = { torrents: [], maxSize: 100, enabled: true }
        const historyPath = path.join(app.getAppPath(), 'history.json')
        
        // Try to load existing history
        try {
            const historyFile = await open(historyPath, 'r')
            const historyContent = await historyFile.readFile('utf-8')
            historyFile.close()
            history = JSON.parse(historyContent)
        } catch (err) {
            // File doesn't exist yet, use defaults
            console.log('Creating new history.json file')
        }
        
        // Check if history is enabled
        if (!history.enabled) {
            return
        }
        
        const maxSize = history.maxSize || 100
        const newEntry = {
            name: torrentName,
            magnetLink: magnetLink,
            addedDate: Date.now()
        }
        
        // Add to beginning of history
        history.torrents.unshift(newEntry)
        
        // Keep only the latest maxSize entries
        history.torrents = history.torrents.slice(0, maxSize)
        
        // Save updated history
        fs.writeFile(historyPath, JSON.stringify(history, null, 4), (err) => {
            if (err) console.error('Error saving torrent history:', err)
        })
    } catch (error) {
        console.error('Error adding torrent to history:', error)
    }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
   app.quit();
}

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
	width: 1280,
	height: 720,
	webPreferences: {
	    preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
	},
    });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    // Open the DevTools.
    //mainWindow.webContents.openDevTools();
    
    // Handle window close with confirm before exit setting
    mainWindow.on('close', (event) => {
        // Load settings synchronously
        try {
            const settingsFile = fs.readFileSync("settings.json", 'utf-8')
            const settings = JSON.parse(settingsFile)
            
            if (settings.general?.confirmBeforeExit) {
                event.preventDefault()
                
                const result = dialog.showMessageBoxSync(mainWindow, {
                    type: 'question',
                    buttons: ['Zůstat', 'Zavřít'],
                    defaultId: 0,
                    title: 'Potvrdit zavření',
                    message: 'Jste si jisti, že chcete zavřít aplikaci?',
                    detail: 'Máte aktivní stahování.'
                })
                
                if (result === 1) {
                    mainWindow.destroy()
                }
            }
        } catch (error) {
            console.error('Error in window close handler:', error)
            // If error, just close normally
        }
    })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    let settings = fs.readFileSync("settings.json")
    let parsedSettings = JSON.parse(settings)
    let darkMode = parsedSettings.appearance.darkMode
    let lightnessMode = darkMode ? 'dark' : 'light'
    nativeTheme.themeSource = lightnessMode
    
    // Handle start on launch setting
    const startOnLaunch = parsedSettings.general?.startOnLaunch || false
    app.setLoginItemSettings({
        openAtLogin: startOnLaunch,
        path: process.execPath,
        args: [app.getAppPath()]
    })
    
    createWindow();
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
	    createWindow();
	}
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
	app.quit();
    }
});

ipcMain.handle("openForm", () => {
    formWindow = new BrowserWindow({
	width: 1024,
	height: 576,
	parent: mainWindow,
	modal: true, 
	webPreferences: {
	    preload: FORM_WINDOW_PRELOAD_WEBPACK_ENTRY,
	},
    })

    formWindow.loadURL(FORM_WINDOW_WEBPACK_ENTRY)
})

ipcMain.handle("openSettings", () => {
    settingsWindow = new BrowserWindow({
	width: 1024,
	height: 576,
	parent: mainWindow,
	modal: true,
	webPreferences: {
	    preload: SETTINGS_WINDOW_PRELOAD_WEBPACK_ENTRY,
	},
    })

    settingsWindow.loadURL(SETTINGS_WINDOW_WEBPACK_ENTRY)

    settingsWindow.on("close", () => {
	
    })
})

ipcMain.handle("openFiles", async (event, extensions) => {
    let filterName = extensions[0] == '*' ? "All Files" : "Torrent Files"
    const result = await dialog.showOpenDialog({
	properties: ['openFile', 'multiSelections'],
	filters: [
	    {name: filterName, extensions: extensions}, ]
    })

    if (result.canceled) {
	return []
    }

    return result.filePaths
})

ipcMain.handle("openFolder", async () => {
    const result = await dialog.showOpenDialog({
	properties: ['openDirectory'],
    })
    return result.filePaths[0] == undefined ? app.getPath('downloads') : result.filePaths[0]
})

ipcMain.handle("getDownloadsFolder", async () => {
    const downloadsFolder = app.getPath('downloads')
    return downloadsFolder
})

ipcMain.handle("downloadTorrent", async (event, saveLocation, fileList, linkList, startTorrent, hashCheck) => {
    console.log('downloadTorrent handler called')
    
    try {
        let torrentList = fileList.concat(linkList)
        console.log('Total to add:', torrentList.length)
        
        for (let i = 0; i < torrentList.length; i++) {
            const torrentThing = torrentList[i]
            console.log(`Adding torrent ${i + 1}/${torrentList.length}`)
            
            const torrentsBefore = client.torrents.length

            client.add(torrentThing, {
                path: saveLocation,
                skipVerify: hashCheck,
                paused: !startTorrent,
            })
            
            // Give the client a moment to add it
            setImmediate(() => {
                const newTorrents = client.torrents.filter((t, idx) => idx >= torrentsBefore)
                console.log('Found new torrents:', newTorrents.length)
                
                newTorrents.forEach((torrent) => {
                    console.log('Setting up torrent:', torrent.name)
                    
                    const torrentId = torrent.infoHash
                    
                    // Function to send torrent to UI
                    const sendToUI = () => {
                        if (mainWindow && mainWindow.webContents) {
                            console.log('Sending to UI:', torrent.name, 'Length:', torrent.length)
                            mainWindow.webContents.send('addTorrentToList', {
                                torrentId: torrentId,
                                torrentName: torrent.name,
                                size: torrent.length ? formatBytes(torrent.length) : 'Výpočet...',
                                progress: Math.round(torrent.progress * 100),
                                speed: '0 B/s',
                                peers: '0 (0)',
                                status: startTorrent ? 'Připojování' : 'Pozastaveno'
                            })
                            // Add to history
                            const magnetLink = torrent.magnetURI || torrent.torrentFile
                            addTorrentToHistory(torrent.name, magnetLink)
                        }
                    }
                    
                    let sent = false
                    
                    // Wait for metadata event
                    torrent.once('metadata', () => {
                        console.log('Metadata loaded:', torrent.name)
                        if (!sent) {
                            sent = true
                            sendToUI()
                        }
                    })
                    
                    // Fallback timeout if metadata doesn't fire
                    setTimeout(() => {
                        if (!sent) {
                            console.log('Metadata timeout, sending anyway')
                            sent = true
                            sendToUI()
                        }
                    }, 1000)
                    
                    pendingTorrents.add(torrentId)
                    startTorrentUpdates(torrent)
                    
                    torrent.on('done', () => {
                        console.log('Done:', torrent.name)
                        if (mainWindow && mainWindow.webContents) {
                            mainWindow.webContents.send('updateTorrentStatus', torrentId, 'Sdílení')
                        }
                    })

                    torrent.on('error', (err) => {
                        console.error('Error:', err)
                        if (mainWindow && mainWindow.webContents) {
                            mainWindow.webContents.send('updateTorrentStatus', torrentId, 'Chyba')
                        }
                    })
                })
            })
        }
        
        console.log('Closing form')
        if (formWindow) {
            formWindow.close()
        }
    } catch (err) {
        console.error('Error:', err)
        throw err
    }
})

// Handle torrent removal
ipcMain.handle("removeTorrent", async (event, torrentId) => {
    try {
        const torrent = client.torrents.find(t => t.infoHash === torrentId)
        if (torrent) {
            torrent.destroy()
            stopTorrentUpdates(torrentId)
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('removeTorrentFromList', torrentId)
            }
            console.log('Torrent removed:', torrentId)
        }
    } catch (err) {
        console.error('Error removing torrent:', err)
    }
})

// Handle torrent pause
ipcMain.handle("pauseTorrent", async (event, torrentId) => {
    try {
        const torrent = client.torrents.find(t => t.infoHash === torrentId)
        if (torrent) {
            torrent.pause()
            stopTorrentUpdates(torrentId)
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('updateTorrentStatus', torrentId, 'Pozastaveno')
            }
            console.log('Torrent paused:', torrentId)
        }
    } catch (err) {
        console.error('Error pausing torrent:', err)
    }
})

// Handle torrent resume
ipcMain.handle("resumeTorrent", async (event, torrentId) => {
    try {
        const torrent = client.torrents.find(t => t.infoHash === torrentId)
        if (torrent) {
            torrent.resume()
            startTorrentUpdates(torrent)
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('updateTorrentStatus', torrentId, 'Stahování')
            }
            console.log('Torrent resumed:', torrentId)
        }
    } catch (err) {
        console.error('Error resuming torrent:', err)
    }
})

ipcMain.handle("createTorrent", async (event, itemsToUpload, torrentName, trackerURLs, torrentComment, pieceLength, privateTorrent, startSeeding) => {
    try {
        const autoValue = ""
        if(pieceLength != autoValue){
            pieceLength = Number(pieceLength)
        }

        console.log('Creating torrent:', torrentName)
        
        client.seed(itemsToUpload, {
            name: torrentName,
            announce: trackerURLs,
            comment: torrentComment,
            pieceLength: pieceLength,
            private: privateTorrent,
            paused: !startSeeding,
            createdBy: "Meowrent - PirateCZ"
        })
        
        console.log('✓ Seeding started for:', torrentName)
        
        if (formWindow) {
            formWindow.close()
        }
    } catch (err) {
        console.error('Error in createTorrent handler:', err)
        throw err
    }
})

ipcMain.handle("toggleDarkMode", () => {
    if (nativeTheme.shouldUseDarkColors) { //if we already have dark mode swithc to light mode
	nativeTheme.themeSource = 'light'
    } else {
	nativeTheme.themeSource = 'dark'
    }
    //return nativeTheme.shouldUseDarkColors
})

ipcMain.handle("setLightnesMode", (event, shouldUseDarkColors) => {
    let mode = shouldUseDarkColors ? 'dark' : 'light'
    nativeTheme.themeSource = mode
})

ipcMain.handle("saveSettingsToJSON", (event, settings) => {
    fs.writeFile('settings.json', JSON.stringify(settings, null, 4), (err) => {
	if (err) throw err
    })
})

ipcMain.handle("loadSettings", async () => {
    let settingsFile = await open(path.join(app.getAppPath(), 'settings.json'), 'r')

    let settings = await settingsFile.readFile("utf-8")
    settingsFile.close()
    return JSON.parse(settings)
})

ipcMain.handle("changeMainWindowColor", (event, primaryColor, secondaryColor) => {
    mainWindow.webContents.send("changeThemeColors", primaryColor, secondaryColor)
})

ipcMain.handle("themeCircleContextMenu", (event, circleNumber) => {
    themeMenu = new Menu()
    themeMenu.append(new MenuItem({ label: 'Smazat motiv', click: () => {
	settingsWindow.webContents.send("deleteTheme", circleNumber)
    }}))

    themeMenu.popup({
	window: BrowserWindow.fromWebContents(event.sender)
    })
})

ipcMain.handle("showConfirmDialog", async (event, title, message) => {
    const result = await dialog.showMessageBox(settingsWindow, {
        type: 'question',
        buttons: ['Cancel', 'OK'],
        defaultId: 0,
        title: title,
        message: message
    })
    return result.response === 1
})

ipcMain.handle("exportSettings", async (event, settings) => {
    const result = await dialog.showSaveDialog(settingsWindow, {
        title: 'Export Settings',
        defaultPath: 'meowrent-settings.json',
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    })

    if (!result.canceled && result.filePath) {
        try {
            await fs.promises.writeFile(result.filePath, JSON.stringify(settings, null, 4))
            await dialog.showMessageBox(settingsWindow, {
                type: 'info',
                title: 'Success',
                message: 'Settings exported successfully!'
            })
        } catch (error) {
            await dialog.showMessageBox(settingsWindow, {
                type: 'error',
                title: 'Error',
                message: 'Failed to export settings: ' + error.message
            })
        }
    }
})

ipcMain.handle("updateStartOnLaunch", (event, enabled) => {
    try {
        app.setLoginItemSettings({
            openAtLogin: enabled,
            path: process.execPath,
            args: [app.getAppPath()]
        })
        return { success: true }
    } catch (error) {
        console.error('Error updating start on launch:', error)
        return { success: false, error: error.message }
    }
})

// Handle opening external URLs in default browser
ipcMain.handle("openExternal", async (event, url) => {
    try {
        await shell.openExternal(url)
        return { success: true }
    } catch (error) {
        console.error('Error opening external URL:', error)
        return { success: false, error: error.message }
    }
})
