const { app, BrowserWindow, ipcMain, dialog, nativeTheme, Menu, MenuItem } = require('electron')
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

// Utility function to extract filename from path
const getNameFromPath = (path) => {
    if (!path) return null
    const parts = path.replace(/\\/g, '/').split('/')
    return parts[parts.length - 1]
}

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

        let status = 'Waiting'
        if (torrent.paused) {
            status = 'Paused'
        } else if (progress === 100) {
            status = 'Seeding'
        } else if (speed > 0) {
            status = 'Downloading'
        } else if (connectedPeers > 0) {
            status = 'Connecting'
        }

        // Send batch update
        mainWindow.webContents.send('updateTorrentData', torrentId, {
            progress,
            speed: speedFormatted,
            peers: `${connectedPeers} (${totalPeers})`,
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
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    let settings = fs.readFileSync("settings.json")
    let darkMode = JSON.parse(settings).appearance.darkMode
    let lightnessMode = darkMode ? 'dark' : 'light'
    nativeTheme.themeSource = lightnessMode
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
                    
                    // Skip if we already sent this torrent to UI
                    if (pendingTorrents.has(torrentId)) {
                        console.log('Torrent already pending:', torrentId)
                        return
                    }
                    
                    pendingTorrents.add(torrentId)
                    
                    // Function to send torrent to UI
                    const sendToUI = () => {
                        if (mainWindow && mainWindow.webContents) {
                            let displayName = torrent.name
                            if (!displayName || displayName.trim() === '') {
                                // Try to extract filename from the torrent source
                                if (torrentThing && !torrentThing.startsWith('magnet:')) {
                                    displayName = getNameFromPath(torrentThing)
                                }
                            }
                            if (!displayName || displayName.trim() === '') {
                                displayName = torrent.infoHash || 'Unknown Torrent'
                            }
                            
                            console.log('Sending to UI:', displayName, 'Length:', torrent.length)
                            mainWindow.webContents.send('addTorrentToList', {
                                torrentId: torrentId,
                                torrentName: displayName,
                                size: torrent.length ? formatBytes(torrent.length) : 'Calculating...',
                                progress: Math.round(torrent.progress * 100),
                                speed: '0 B/s',
                                peers: '0 (0)',
                                status: startTorrent ? 'Connecting' : 'Paused'
                            })
                        }
                    }
                    
                    let sent = false
                    
                    // Wait for metadata event
                    torrent.once('metadata', () => {
                        console.log('Metadata loaded:', torrent.name)
                        if (!sent) {
                            sent = true
                            sendToUI()
                        } else {
                            // Metadata arrived after initial send - update the size and name if needed
                            if (mainWindow && mainWindow.webContents) {
                                console.log('Updating size and metadata for torrent:', torrent.name)
                                mainWindow.webContents.send('updateTorrentSize', torrentId, torrent.length)
                                // Also update the name in case it was undefined before
                                if (torrent.name) {
                                    mainWindow.webContents.send('updateTorrentName', torrentId, torrent.name)
                                }
                            }
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
                    
                    startTorrentUpdates(torrent)
                    
                    torrent.on('done', () => {
                        console.log('Done:', torrent.name)
                        if (mainWindow && mainWindow.webContents) {
                            mainWindow.webContents.send('updateTorrentStatus', torrentId, 'Seeding')
                        }
                    })

                    torrent.on('error', (err) => {
                        console.error('Error:', err)
                        if (mainWindow && mainWindow.webContents) {
                            mainWindow.webContents.send('updateTorrentStatus', torrentId, 'Error')
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

// Helper function to process a seeded torrent and send it to UI
const processSeededTorrent = (torrent, torrentId, torrentName, itemsToUpload, startSeeding) => {
    if (pendingTorrents.has(torrentId)) {
        console.log('Torrent already pending:', torrentId)
        return
    }
    
    pendingTorrents.add(torrentId)
    
    if (mainWindow && mainWindow.webContents) {
        // Build display name with multiple fallbacks
        let displayName = torrentName
        if (!displayName || displayName.trim() === '') {
            displayName = torrent.name
        }
        if (!displayName || displayName.trim() === '') {
            // Try to extract filename from the upload path
            if (itemsToUpload && itemsToUpload.length > 0) {
                displayName = getNameFromPath(itemsToUpload[0])
            }
        }
        if (!displayName || displayName.trim() === '') {
            displayName = torrentId || 'Unknown Torrent'
        }
        
        console.log('Sending seeded torrent to UI:', displayName)
        mainWindow.webContents.send('addTorrentToList', {
            torrentId: torrentId,
            torrentName: displayName,
            size: torrent.length ? formatBytes(torrent.length) : 'Calculating...',
            progress: Math.round(torrent.progress * 100),
            speed: '0 B/s',
            peers: '0 (0)',
            status: startSeeding ? 'Seeding' : 'Paused'
        })
        console.log('✓ Sent to UI')
    } else {
        console.error('Cannot send to UI - mainWindow or webContents is not available')
    }
    
    startTorrentUpdates(torrent)
    
    torrent.on('done', () => {
        console.log('Seeding done:', torrent.name)
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('updateTorrentStatus', torrentId, 'Seeding')
        }
    })

    torrent.on('error', (err) => {
        console.error('Seeding error:', err)
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('updateTorrentStatus', torrentId, 'Error')
        }
    })
}

ipcMain.handle("createTorrent", async (event, itemsToUpload, torrentName, trackerURLs, torrentComment, pieceLength, privateTorrent, startSeeding) => {
    try {
        const autoValue = ""
        if(pieceLength != autoValue){
            pieceLength = Number(pieceLength)
        }

        console.log('Creating torrent:', torrentName)
        console.log('Items to upload:', itemsToUpload)
        
        const torrentsBefore = client.torrents.length
        
        client.seed(itemsToUpload, {
            name: torrentName,
            announce: trackerURLs,
            comment: torrentComment,
            pieceLength: pieceLength,
            private: privateTorrent,
            paused: !startSeeding,
            createdBy: "Meowrent - PirateCZ"
        })
        
        // Give the client a moment to add the torrent
        setImmediate(() => {
            const newTorrents = client.torrents.filter((t, idx) => idx >= torrentsBefore)
            console.log('Found new seeded torrents:', newTorrents.length)
            
            newTorrents.forEach((torrent) => {
                console.log('Setting up seeded torrent:', torrent.name)
                
                let torrentId = torrent.infoHash
                console.log('Torrent infoHash:', torrentId)
                
                // If infoHash is not available yet, wait a bit and try again
                if (!torrentId) {
                    console.log('infoHash not available yet, waiting...')
                    setTimeout(() => {
                        torrentId = torrent.infoHash
                        console.log('After wait, infoHash is:', torrentId)
                        if (!torrentId) {
                            console.error('SKIPPING: Still no infoHash for:', torrent.name)
                            return
                        }
                        processSeededTorrent(torrent, torrentId, torrentName, itemsToUpload, startSeeding)
                    }, 100)
                    return
                }
                
                processSeededTorrent(torrent, torrentId, torrentName, itemsToUpload, startSeeding)
            })
        })
        
        if (formWindow) {
            // Close the form after a brief delay to ensure messages are sent
            setTimeout(() => {
                if (formWindow) {
                    formWindow.close()
                    formWindow = null
                }
            }, 100)
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
    themeMenu.append(new MenuItem({ label: 'Delete Theme', click: () => {
	settingsWindow.webContents.send("deleteTheme", circleNumber)
    }}))

    themeMenu.popup({
	window: BrowserWindow.fromWebContents(event.sender)
    })
})
