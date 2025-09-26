const darkModeButton = document.getElementById('toggleDarkMode')
const toggleViewButton = document.getElementById('toggleView')
const backButton = document.getElementById('backButton')
const fsEntriesDiv = document.getElementById('fsEntriesDiv')
const currentPathDiv = document.getElementById('currentPathDiv')
let fsEntries = null
let currentViewMode = null
let currentPath = null

//first to run
document.addEventListener('DOMContentLoaded', async () => {
    const isDarkMode = await window.themeApi.systemTheme()
    changeDarkModeBtnIcon(isDarkMode)

    document.addEventListener('contextmenu', async (e) => {
	e.preventDefault()

	await window.menuApi.showContextMenu(e.x, e.y)
    })

    document.addEventListener('contextlost', () => {console.log("contextlost")})

    currentViewMode = fsEntriesDiv.classList[fsEntriesDiv.classList.length -1]
    currentPath = await window.pathApi.getHomePath()
    await loadFiles()
    showFiles()
})

//here we send null to smybolize that we return back 
backButton.addEventListener('click', async () => {
    currentPath = await window.pathApi.changePath(currentPath, null)
    await loadFiles()
    showFiles()
})

//loading files
async function loadFiles() {
    currentPathDiv.innerText = currentPath
    fsEntries = await window.fileApi.getFiles(currentPath)
}

function showFiles() {
    fsEntriesDiv.innerHTML = "" 

    if(currentViewMode == 'list-view'){ 
	let header = document.createElement('div')
	header.classList.add('list-header', "list-data")
	header.innerHTML = 
	`
	    <div class="col name">Name</div>
	    <div class="col size">Size</div>
	    <div class="col modified">Modified</div>
	`
	fsEntriesDiv.appendChild(header)
    }

    if(fsEntries == null){
	let warning = document.createElement('h2')
	warning.innerText = 'Permisions Denied Probably'
	warning.classList.add('warning')
	fsEntriesDiv.appendChild(warning)
    }
    
    fsEntries.forEach(fsEntry => {
	if(fsEntry.isDirectory) {
	    createFolderDiv(fsEntry)
	}
	else {
	    createFileDiv(fsEntry)
	}
    })
}

//creating buttons handling
async function createFolderDiv(folder) {
    let entry = document.createElement("div")
    entry.classList.add('file-entry', 'folder')

    const iconPath = await window.fileApi.getIcon(folder)

    if(currentViewMode == 'list-view'){
	entry.classList.add('list-data')

	entry.innerHTML = `
	    <div class="col name">
		<img src="${iconPath}" width="24" height="24" />
		<span>${folder.name}</span>
	    </div>
	    <div class="col size">${folder.size}</div>
	    <div class="col modified">${folder.date}</div>
	`

    }
    else {
	entry.classList.add('grid-view')

	entry.innerHTML = 
	`
	    <img src="${iconPath}">
	    <p>${folder.name}</p>
	`
    }

    entry.addEventListener('dblclick', async () => {
	currentPath = await window.pathApi.changePath(currentPath, folder.name)
	await loadFiles()
	showFiles()
	window.scrollTo(0,0)
    })

    fsEntriesDiv.appendChild(entry)
}

async function createFileDiv(file) {
    let entry = document.createElement("div")
    entry.classList.add('file-entry', 'file')

    const iconPath = await window.fileApi.getIcon(file)

    if(currentViewMode == 'list-view') {
	entry.classList.add('list-data')

	entry.innerHTML = 
	`
	    <div class="col name">
		<img src="${iconPath}" width="24" height="24" />
		<span>${file.name}</span>
	    </div>
	    <div class="col size">${file.size}</div>
	    <div class="col modified">${file.date}</div>
	`
    }
    else {
	entry.classList.add('grid-view')

	entry.innerHTML = 
	`
	    <img src="${iconPath}">
	    <p>${file.name}</p>
	`
    }

    entry.addEventListener('dblclick', async () => {
	await window.fileApi.openApp(currentPath, file.name)
    })

    fsEntriesDiv.appendChild(entry)
}

//dark mode handling
function changeDarkModeBtnIcon(isDarkMode)
{
    if(isDarkMode)
    {
	darkModeButton.innerText = "🌙"
    }
    else
    {
	darkModeButton.innerText = "☀️"
    }
}

darkModeButton.addEventListener('click', async () => {
    const isDarkMode = await window.themeApi.toggleDarkMode()
    changeDarkModeBtnIcon(isDarkMode)
})

//view handling
toggleViewButton.addEventListener('click', () => {
    fsEntriesDiv.classList.toggle('grid-view')
    fsEntriesDiv.classList.toggle('list-view')
    currentViewMode = fsEntriesDiv.classList[fsEntriesDiv.classList.length -1]
    showFiles()
})
