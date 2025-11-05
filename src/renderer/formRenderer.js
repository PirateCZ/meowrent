import '../css/styles.css'
import '../css/form.css'

const createBtn = document.getElementById('createBtn')
const downloadBtn = document.getElementById('downloadBtn')

const createForm = document.getElementById('createFormDiv')
const downloadForm = document.getElementById('downloadFormDiv')

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

const saveLocationDialogBtn = document.getElementById('saveLocationDialogBtn')
const saveLocationInput = document.getElementById('saveLocation')

saveLocationDialogBtn.addEventListener("click", async () => {
    const folderPath = await window.dialogApi.openDialog()
    saveLocationInput.value = folderPath 
})
