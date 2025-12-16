import '../css/styles.css';
import '../css/main.css';

const addButton = document.getElementById('addTorrentBtn')

addButton.addEventListener('click', async () => {
    await window.formApi.openForm()
})

const downloadBar = document.getElementById('progressBar')
window.interfaceApi.changeDownloadProgress(() => {
    downloadBar.style.width = `90%`
})

const torrentList = document.getElementById('torrentList')
window.interfaceApi.addTorrentToList((event, data) => {
    let torrentDiv = document.createElement('div')
    torrentDiv.classList.add('list-row')
    torrentDiv.tabIndex = 0
    torrentDiv.id = data.torrentName

    let torrentNameCol = document.createElement('div')
    torrentNameCol.classList.add('col')
    torrentNameCol.id = 'name'
    torrentNameCol.innerText = data.torrentName 

    let torrentSizeCol = document.createElement('div')
    torrentSizeCol.classList.add('col')
    torrentSizeCol.id = 'size'
    torrentSizeCol.innerText = '1.2GB'
    
    let torrentProgressCol = document.createElement('div')
    torrentProgressCol.classList.add('col')
    torrentProgressCol.id = 'progress'
    torrentProgressCol.innerHTML = 
	`
	<div class="progress-bar">
	    <div class="progress-fill" style="width:42%"></div>
	</div>
	`
    
    let torrentSpeedCol = document.createElement('div')
    torrentSpeedCol.classList.add('col')
    torrentSpeedCol.id = 'speed'
    torrentSpeedCol.innerText = '320kB/s'
    
    let torrentPeerCol = document.createElement('div')
    torrentPeerCol.classList.add('col')
    torrentPeerCol.id = 'peer'
    torrentPeerCol.innerText = '12 (5)'
    
    let torrentStatusCol = document.createElement('div')
    torrentStatusCol.classList.add('col')
    torrentStatusCol.id = 'status'
    torrentStatusCol.innerText = 'Stahování'
    
    torrentDiv.appendChild(torrentNameCol)
    torrentDiv.appendChild(torrentSizeCol)
    torrentDiv.appendChild(torrentProgressCol)
    torrentDiv.appendChild(torrentSpeedCol)
    torrentDiv.appendChild(torrentPeerCol)
    torrentDiv.appendChild(torrentStatusCol)

    torrentList.appendChild(torrentDiv)
})

