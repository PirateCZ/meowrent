const { app, Menu, MenuItem, BrowserWindow, ipcMain, nativeTheme } = require('electron/main')
const shell = require('electron').shell
const path = require('node:path')
const fs = require('node:fs')
const fsp = require('node:fs').promises
let currentWatcher = undefined

//We want maximum isolation so we specify when we create the window
const createWindow = () => {
    const win = new BrowserWindow({
	width: 800,
	height: 600,
	webPreferences: {
	    preload: path.join(__dirname, 'preload.js'),
	    nodeIntegration: false,
	    contextIsolation: true,
	}
    })

    win.loadFile('src/index.html')
}

//We need this so our windows properly handle closing and opening even on different platforms
app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
	    createWindow()
	}
    })

    app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
	    app.quit()
	}
    })
})

//We need this to expose the home path to the renderer so it can load the home directory on startup
ipcMain.handle('getHomePath', async () => { 
    const homePath = app.getPath('home')

    currentWatcher = fs.watch(homePath, {recursive: false}, () => {
	console.log("sometinh happend here: " + homePath)
    })

    return homePath
})

//Here we return null whenthe code fails so we can handle the behavior in renderer 
//otherwise we map the files so we can specify which things we want to expose to renderer
//and we sort it so we get the wanted order we want to show user
ipcMain.handle('getFiles', async (event, pathToFiles) => {
    if(pathToFiles == undefined) {
	pathToFiles = app.getPath('home')
    }

    let entries = null
    try {
	entries = fs.readdirSync(pathToFiles, {withFileTypes: true})
    } catch (error) {
	return null
    }

    let sortedEntries = [];
    for (let i = 0; i < entries.length; i++) {
	let entry = entries[i]
	let entryStat = null
	try { 
	    if (entry.isDirectory()) {
		entryStat = {
		    size: "WIP",
		    mtime: "IDK",
		}
	    }
	    else {
		entryStat = await fsp.stat(path.join(entry.parentPath, entry.name)) 
	    }
	} catch (err) {
	    entryStat = 
	    {
		size: "",
		mtime: "",
	    }
	}

	let sortedEntry = 
	{
	    name: entry.name,
	    path: path.join(entry.parentPath, entry.name),
	//const index = curPath.lastIndexOf('/') || curPath.lastIndexOf("\\")
	//if(index == -1){
	    //return "/" //TODO: fix to work cross-platform (currently workss only on linux (probably))
	//}
	//const lastPath = curPath.slice(0, index)
	//return lastPath
	    size: entryStat.size,
	    date: entryStat.mtime,
	    isDirectory: entry.isDirectory(),
	}
	sortedEntries.push(sortedEntry)
    }

    sortedEntries = sortedEntries.sort((a, b) => {
	    if (a.isDirectory && !b.isDirectory) return -1;
	    if (!a.isDirectory && b.isDirectory) return 1;
	    return a.name.localeCompare(b.name); 
	})

    return sortedEntries
})

//when name is null we know we pressed the back button
ipcMain.handle('changePath', async (event, curPath, name) => {
    currentWatcher.close()
    
    if(name == null) {
	let parent = path.dirname(curPath)

	if(parent === curPath) {
	     parent = path.parse(curPath).root
	}

	currentWatcher = fs.watch(parent, {recursive: false}, () => {
	    console.log("sometinh happend here: " + parent)
	})

	return parent
    }

    let newPath = path.join(curPath, name)

    currentWatcher = fs.watch(newPath, {recursive: false}, () => {
	console.log("sometinh happend here: " + newPath)
    })

    return newPath
})

//shell uses the default app so we dont have create any custom logic
ipcMain.handle('openApp', (event, curPath, name) => {
    shell.openPath(path.join(curPath, name))
})

//We need to return here so we can accurately change the icon on or dark mode toggle
ipcMain.handle('toggleDarkMode', () => {
    if (nativeTheme.shouldUseDarkColors) {
	nativeTheme.themeSource = 'light'
    } else {
	nativeTheme.themeSource = 'dark'
    }
    return nativeTheme.shouldUseDarkColors
})

//we need to return here so we can accuretely set the icon according to system theme
ipcMain.handle('systemTheme', () => {
    nativeTheme.themeSource = 'system'
    return nativeTheme.shouldUseDarkColors
})

//We use the default electron api here so we can show file icons accuretely otherwise we use default icons
ipcMain.handle('getIcon', async (event, file) => {
    	if(file.isDirectory){
	    const folderIconPath = path.join('..', 'assets', 'folder.svg')
	    return folderIconPath
	}
	else {
	    try {
		const buffer = await app.getFileIcon(file.path, { size: 'large' })
		return buffer.toDataURL()
	    } catch (error) {
		const fileIconPath = path.join('..', 'assets', 'file.svg')
		return fileIconPath
	    }
	}

})

//we use the built in menu function to properly create a context menu
ipcMain.handle('showContextMenu', (event, x, y) => {
    const menu = new Menu()

    if(false) {
	//TODO: implement clicking something else
    }
    else {
	menu.append(new MenuItem({ label: 'New Folder', click: async () => {await createFolder()}}))
    }

    menu.popup({window: BrowserWindow.fromWebContents(event.sender), x, y})
})

async function createFolder() {
    await fsp.mkdir(path.join(app.getPath('home'), "tempDirName"))
}
