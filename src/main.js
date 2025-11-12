const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
let mainWindow = undefined
let formWindow = undefined

import WebTorrent from 'webtorrent'
const client = new WebTorrent()

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
	width: 800,
	height: 600,
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
	width: 600,
	height: 400,
	parent: mainWindow,
	modal: true, 
	webPreferences: {
	    preload: FORM_WINDOW_PRELOAD_WEBPACK_ENTRY,
	},
    })

    formWindow.loadURL(FORM_WINDOW_WEBPACK_ENTRY)
})

ipcMain.handle("openFiles", async () => {
    const result = await dialog.showOpenDialog({
	properties: ['openFile', 'multiSelections'],
	filters: [
	    {name: "Torrent Files", extensions: ['torrent']},
	]
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
    return result.filePaths[0]
})

ipcMain.handle("getDownloadsFolder", async () => {
    const downloadsFolder = app.getPath('downloads')
    return downloadsFolder
})

ipcMain.handle("downloadTorrent", async (event, saveLocation, fileList, linkList, startTorrent, topQueue, hashCheck) => {
    for (let i = 0; i < fileList.length; i++) {
    	client.add(fileList[i], { path: 'saveLocation' }, (torrent) => {
	    console.log("Torrent Name: " + torrent.name)

	    torrent.on('download', () => {
		console.log("Progress: " + (torrent.progress * 100))
	    })

	    torrent.on('wire', (wire, addr) => {
		console.log('Connected to peer:', addr);
	    });

	    torrent.on('done', () => {
		console.log(torrent.name + "is done")
	    })
	})
    }
})
