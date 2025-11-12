import '../css/styles.css'
import '../css/form.css'

const createBtn = document.getElementById('createBtn')
const downloadBtn = document.getElementById('downloadBtn')

const createForm = document.getElementById('createFormDiv')
const downloadForm = document.getElementById('downloadFormDiv')

const downloadTorrentBtn = document.getElementById("downloadTorrentBtn")
const downloadTorrentLinksInput = document.getElementById("torrentLinks")
const downloadTorrentFilesInput = document.getElementById("torrentFiles")
const getTorrentFiles = document.getElementById("getTorrentFiles")

const saveLocationDialogBtn = document.getElementById('saveLocationDialogBtn')
const saveLocationInput = document.getElementById('saveLocationInput')

document.addEventListener('DOMContentLoaded', async () => {
    saveLocationInput.value = await window.dialogApi.getDownloadsFolder()
})

createBtn.addEventListener("click", () => {
    createBtn.classList.toggle("activeBtn")
    downloadBtn.classList.toggle("activeBtn")
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
    let filePaths = await window.dialogApi.openFiles()
    let filePlaceholder = ""
    for (let i = 0; i < filePaths.length; i++) {
    	  filePlaceholder += filePaths[i] + "\n";
    }
    downloadTorrentFilesInput.value = filePlaceholder
})

downloadTorrentBtn.addEventListener("click", async () => {
    let saveLocation = saveLocationInput.value
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

    let startTorrent = document.getElementById("startTorrent").checked
    let topQueue = document.getElementById("topQueue").checked
    let hashCheck = document.getElementById("hashCheck").checked
    if(hasFiles || hasLinks){
	await window.torrentApi.downloadTorrent(saveLocation, filePaths, links, startTorrent, topQueue, hashCheck)
    }
})
