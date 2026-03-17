import '../css/styles.css'
import '../css/form.css'

console.log('formRenderer.js loading...')

const createBtn = document.getElementById('createBtn')
const downloadBtn = document.getElementById('downloadBtn')

const createFormDiv = document.getElementById('createFormDiv')
const downloadFormDiv = document.getElementById('downloadFormDiv')

const downloadTorrentBtn = document.getElementById("downloadTorrentBtn")
const downloadTorrentLinksInput = document.getElementById("torrentLinks")
const downloadTorrentFilesInput = document.getElementById("torrentFiles")
const getTorrentFiles = document.getElementById("getTorrentFiles")

const saveLocationDialogBtn = document.getElementById('saveLocationDialogBtn')
const saveLocationInput = document.getElementById('saveLocationInput')

const createTorrentBtn = document.getElementById('createTorrentBtn')

const uploadFilesBtn = document.getElementById('getUploadFiles')
const uploadFolderBtn = document.getElementById('getUploadFolder')
const uploadInput = document.getElementById('uploadInput')

console.log('Elements found:', {
    createBtn: !!createBtn,
    downloadBtn: !!downloadBtn,
    createFormDiv: !!createFormDiv,
    downloadFormDiv: !!downloadFormDiv,
    downloadTorrentBtn: !!downloadTorrentBtn,
    saveLocationInput: !!saveLocationInput,
    createTorrentBtn: !!createTorrentBtn
})

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Form DOMContentLoaded fired')
    
    try {
        console.log('Loading settings...')
        let loadedSettings = await window.themeApi.loadSettings()
        console.log('Settings loaded:', loadedSettings)
        
        let activeTheme = undefined
        for (let i = 0; i < loadedSettings.appearance.themes.length; i++) {
            const theme = loadedSettings.appearance.themes[i];
            if(theme.active == true) {
                activeTheme = theme
            }
        }
        
        if (activeTheme) {
            document.documentElement.style.setProperty("--surface", activeTheme.primaryColor)
            document.documentElement.style.setProperty("--muted", activeTheme.secondaryColor)
            console.log('Theme applied')
        }
        
        console.log('Getting downloads folder...')
        const downloadsFolder = await window.dialogApi.getDownloadsFolder()
        console.log('Downloads folder:', downloadsFolder)
        
        if (saveLocationInput) {
            saveLocationInput.value = downloadsFolder
            console.log('Save location input set to:', downloadsFolder)
        } else {
            console.error('saveLocationInput element not found!')
        }
    } catch (err) {
        console.error('Error in DOMContentLoaded:', err)
    }
})

createBtn.addEventListener("click", () => {
    createBtn.classList.toggle("activeBtn")
    createBtn.classList.toggle("inactiveBtn")
    downloadBtn.classList.toggle("activeBtn")
    downloadBtn.classList.toggle("inactiveBtn")
    createFormDiv.classList.toggle("hidden")
    downloadFormDiv.classList.toggle("hidden")
})

downloadBtn.addEventListener("click", () => {
    createBtn.classList.toggle("activeBtn")
    downloadBtn.classList.toggle("activeBtn")
    createFormDiv.classList.toggle("hidden")
    downloadFormDiv.classList.toggle("hidden")
})

saveLocationDialogBtn.addEventListener("click", async () => {
    const folderPath = await window.dialogApi.openFolder()
    saveLocationInput.value = folderPath 
})

getTorrentFiles.addEventListener("click", async () => {
    let filePaths = await window.dialogApi.openFiles(['torrent'])
    let filePlaceholder = ""
    for (let i = 0; i < filePaths.length; i++) {
    	  filePlaceholder += filePaths[i] + "\n";
    }
    downloadTorrentFilesInput.value = filePlaceholder
})

uploadFilesBtn.addEventListener("click", async () => {
    let filePaths = await window.dialogApi.openFiles(['*'])
    let filePlaceholder = ""
    for (let i = 0; i < filePaths.length; i++) {
    	  filePlaceholder += filePaths[i] + "\n";
    }
    uploadInput.value = filePlaceholder
})

uploadFolderBtn.addEventListener("click", async () => {
    const folderPath = await window.dialogApi.openFolder()
    uploadInput.value = folderPath
})

downloadTorrentBtn.addEventListener("click", async () => {
    try {
        console.log('Download torrent button clicked')
        
        let saveLocation = saveLocationInput.value
        console.log('Save location:', saveLocation)
        
        let hasFiles = false
        let hasLinks = false
        
        let filePaths = downloadTorrentFilesInput.value.split("\n")
        if(filePaths[filePaths.length-1] == ""){
            filePaths.pop()
        }
        if(filePaths.length > 0){
            hasFiles = true
        }

        let links = downloadTorrentLinksInput.value.split("\n")
        if(links[links.length-1] == ""){
            links.pop()
        }
        if(links.length > 0){
            hasLinks = true
        }

        console.log('Has files:', hasFiles, 'Has links:', hasLinks)
        
        if(!hasFiles && !hasLinks) {
            console.error('No files or links provided')
            alert('Prosím, vložte soubor nebo odkaz')
            return
        }

        let startTorrent = document.getElementById("startTorrent").checked
        let hashCheck = document.getElementById("hashCheck").checked
        
        console.log('Calling downloadTorrent with:', {saveLocation, filePaths, links, startTorrent, hashCheck})
        await window.torrentApi.downloadTorrent(saveLocation, filePaths, links, startTorrent, hashCheck)
        console.log('Download torrent completed')
    } catch (err) {
        console.error('Error downloading torrent:', err)
        alert('Chyba při stahování: ' + err.message)
    }
})

createTorrentBtn.addEventListener('click', async () => {
    try {
        console.log('Create torrent button clicked')
        
        let itemsToUpload = uploadInput.value.split("\n")
        if(itemsToUpload[itemsToUpload.length-1] == ""){
            itemsToUpload.pop()	
        }

        if(itemsToUpload.length === 0) {
            console.error('No items selected for upload')
            alert('Prosím, vyberte soubory nebo složku')
            return
        }

        let torrentName = document.getElementById("torrentName").value
        if(!torrentName || torrentName.trim() === '') {
            console.error('No torrent name provided')
            alert('Prosím, vložte název torrentu')
            return
        }

        let trackerURLs = document.getElementById("announceList").value.split("\n")
        if(trackerURLs[trackerURLs.length-1] == ""){
            trackerURLs.pop()	
        }
        
        let torrentComment = document.getElementById("torrentComment").value
        let pieceLength = document.getElementById("pieceLength").value
        let privateTorrent = document.getElementById("privateTorrent").checked
        let startSeeding = document.getElementById("startSeeding").checked

        console.log('Calling createTorrent with:', {itemsToUpload, torrentName, trackerURLs, privateTorrent, startSeeding})
        
        await window.torrentApi.createTorrent(itemsToUpload, torrentName, trackerURLs, torrentComment, pieceLength, privateTorrent, startSeeding)
        console.log('Create torrent completed')
    } catch (err) {
        console.error('Error creating torrent:', err)
        alert('Chyba při vytváření torrentu: ' + err.message)
    }
})
