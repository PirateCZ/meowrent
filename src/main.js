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
    let torrentList = fileList.concat(linkList)
    for (let i = 0; i < torrentList.length; i++) {
    	const torrentThing = torrentList[i]

	client.add(torrentThing, {
	    path: saveLocation,
	    skipVerify: hashCheck,
	    paused: !startTorrent, //if I want to start seeding I dont want it to be paused
	}, (torrent) => {
	    mainWindow.webContents.send('addTorrentToList', { torrentName: torrent.name })

	    torrent.on('download', () => {
		if(lastDownloadProgress != Math.floor(torrent.progress * 100)){
		    lastDownloadProgress = Math.floor(torrent.progress * 100)
		    console.log(`Progress for ${torrent.name}: ${lastDownloadProgress}%`)
		}

	    })

	    torrent.on('done', async () => {
		console.log(`${torrent.name} is done downloading`)
	    })
	})
    }
    formWindow.close()
})

ipcMain.handle("createTorrent", async (event, itemsToUpload, torrentName, trackerURLs, torrentComment, pieceLength, privateTorrent, startSeeding) => {
    const autoValue = ""
    if(pieceLength != autoValue){
	pieceLength = Number(pieceLength)
    }

    client.seed(itemsToUpload, {
	name: torrentName,
	announce: trackerURLs,
	comment: torrentComment,
	pieceLength: pieceLength,
	private: privateTorrent,
	paused: !startSeeding, //if I want to start seeding I dont want it to be paused
	createdBy: "Meowrent - PirateCZ"
    }, (torrent) => {
	console.log("torrent strted seeding")
	console.log("Here's the magnet: " + torrent.magnetURI)
	mainWindow.webContents.send('addTorrentToList', { torrentName: torrent.name })
    })

    formWindow.close()
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
