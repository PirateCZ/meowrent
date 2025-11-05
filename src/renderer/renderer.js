import '../css/styles.css';
import '../css/main.css';

const addButton = document.getElementById('addTorrentBtn')

addButton.addEventListener('click', async () => {
    await window.formApi.openForm()
})
