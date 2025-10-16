import './index.css';
console.log("Hello World!")

const addButton = document.getElementById('addTorrentBtn')

addButton.addEventListener('click', async () => {
    await window.formApi.openForm()
})
