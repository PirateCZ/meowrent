import '../css/styles.css';
import '../css/main.css';

// Torrent Data Manager
class TorrentManager {
    constructor() {
        this.torrents = new Map(); // Store torrent data by ID
        this.updateQueue = [];
    }

    // Add a new torrent to the list
    addTorrent(torrentId, torrentName, torrentData = {}) {
        this.torrents.set(torrentId, {
            id: torrentId,
            name: torrentName,
            size: torrentData.size || 'Unknown',
            progress: torrentData.progress || 0,
            speed: torrentData.speed || '0 B/s',
            peers: torrentData.peers || '0 (0)',
            status: torrentData.status || 'Waiting',
            downloadedBytes: torrentData.downloadedBytes || 0,
            totalBytes: torrentData.totalBytes || 0
        });
    }

    // Update a specific property of a torrent
    updateTorrent(torrentId, updates) {
        if (this.torrents.has(torrentId)) {
            const torrent = this.torrents.get(torrentId);
            Object.assign(torrent, updates);
            return torrent;
        }
        return null;
    }

    // Get torrent data
    getTorrent(torrentId) {
        return this.torrents.get(torrentId);
    }

    // Get all torrents
    getAllTorrents() {
        return Array.from(this.torrents.values());
    }

    // Remove a torrent
    removeTorrent(torrentId) {
        return this.torrents.delete(torrentId);
    }
}

const torrentManager = new TorrentManager();

// DOM Update Helper Functions
const updateTorrentDOM = (torrentId, torrentData) => {
    const torrentElement = document.getElementById(torrentId);
    if (!torrentElement) return;

    // Update progress
    if (torrentData.progress !== undefined) {
        const progressFill = torrentElement.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${torrentData.progress}%`;
        }
    }

    // Update speed
    if (torrentData.speed !== undefined) {
        const speedCol = torrentElement.querySelector('#speed');
        if (speedCol) {
            speedCol.innerText = torrentData.speed;
        }
    }

    // Update peers
    if (torrentData.peers !== undefined) {
        const peerCol = torrentElement.querySelector('#peer');
        if (peerCol) {
            peerCol.innerText = torrentData.peers;
        }
    }

    // Update status
    if (torrentData.status !== undefined) {
        const statusCol = torrentElement.querySelector('#status');
        if (statusCol) {
            statusCol.innerText = torrentData.status;
        }
    }

    // Update size
    if (torrentData.size !== undefined) {
        const sizeCol = torrentElement.querySelector('#size');
        if (sizeCol) {
            sizeCol.innerText = torrentData.size;
        }
    }

    // Update name
    if (torrentData.name !== undefined) {
        const nameCol = torrentElement.querySelector('#name');
        if (nameCol) {
            nameCol.innerText = torrentData.name;
        }
    }
};

const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

document.addEventListener('DOMContentLoaded', async () => {
    let settings = await window.onLoad.loadSettings()
    let activeTheme = undefined
    for (let i = 0; i < settings.appearance.themes.length; i++) {
    	const theme = settings.appearance.themes[i];
    	if(theme.active == true) {
	    activeTheme = theme
	}
    }
    document.documentElement.style.setProperty("--surface", activeTheme.primaryColor)
    document.documentElement.style.setProperty("--muted", activeTheme.secondaryColor)
    await window.interfaceApi.setLightnesMode(settings.appearance.darkMode)

})


const addButton = document.getElementById('addTorrentButton')
addButton.addEventListener('click', async () => {
    await window.windowApi.openForm()
})

const settingsButton = document.getElementById('settingsButton')
settingsButton.addEventListener('click', async () => {
    await window.windowApi.openSettings()
})

const downloadBar = document.getElementById('progressBar')
window.interfaceApi.changeDownloadProgress(() => {
    downloadBar.style.width = `90%`
})

const torrentList = document.getElementById('torrentList')
const emptyState = document.getElementById('emptyState')
if (!torrentList) {
    console.error('ERROR: torrentList element not found!')
}

// Helper function to show/hide empty state
const updateEmptyState = () => {
    if (!emptyState) return
    const torrentRows = torrentList.querySelectorAll('.list-row')
    if (torrentRows.length === 0) {
        emptyState.style.display = 'flex'
    } else {
        emptyState.style.display = 'none'
    }
}

console.log('Setting up addTorrentToList listener...')

window.interfaceApi.addTorrentToList((event, data) => {
    console.log('Received addTorrentToList event:', data)
    
    if (!torrentList) {
        console.error('ERROR: torrentList is not available')
        return
    }
    
    const torrentId = data.torrentId;
    
    // Check if this torrent is already in the list
    const existingTorrent = document.getElementById(torrentId)
    if (existingTorrent) {
        console.log('Torrent already in list:', torrentId)
        return
    }
    
    // Add to torrent manager
    torrentManager.addTorrent(torrentId, data.torrentName, {
        size: data.size || 'Calculating...',
        progress: data.progress || 0,
        speed: data.speed || '0 B/s',
        peers: data.peers || '0 (0)',
        status: data.status || 'Connecting...'
    });

    let torrentDiv = document.createElement('div')
    torrentDiv.classList.add('list-row')
    torrentDiv.tabIndex = 0
    torrentDiv.id = torrentId

    let torrentNameCol = document.createElement('div')
    torrentNameCol.classList.add('col')
    torrentNameCol.id = 'name'
    torrentNameCol.innerText = data.torrentName 

    let torrentSizeCol = document.createElement('div')
    torrentSizeCol.classList.add('col')
    torrentSizeCol.id = 'size'
    torrentSizeCol.innerText = data.size || 'Calculating...'
    
    let torrentProgressCol = document.createElement('div')
    torrentProgressCol.classList.add('col')
    torrentProgressCol.id = 'progress'
    torrentProgressCol.innerHTML = 
	`
	<div class="progress-bar">
	    <div class="progress-fill" style="width:${data.progress || 0}%"></div>
	</div>
	`
    
    let torrentSpeedCol = document.createElement('div')
    torrentSpeedCol.classList.add('col')
    torrentSpeedCol.id = 'speed'
    torrentSpeedCol.innerText = data.speed || '0 B/s'
    
    let torrentPeerCol = document.createElement('div')
    torrentPeerCol.classList.add('col')
    torrentPeerCol.id = 'peer'
    torrentPeerCol.innerText = data.peers || '0 (0)'
    
    let torrentStatusCol = document.createElement('div')
    torrentStatusCol.classList.add('col')
    torrentStatusCol.id = 'status'
    torrentStatusCol.innerText = data.status || 'Connecting...'
    
    torrentDiv.appendChild(torrentNameCol)
    torrentDiv.appendChild(torrentSizeCol)
    torrentDiv.appendChild(torrentProgressCol)
    torrentDiv.appendChild(torrentSpeedCol)
    torrentDiv.appendChild(torrentPeerCol)
    torrentDiv.appendChild(torrentStatusCol)

    torrentList.appendChild(torrentDiv)
    console.log('Torrent div created and appended:', torrentId)
    updateEmptyState()
    
    // Add right-click context menu (Electron native)
    torrentDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        // Get the current status from the torrent manager
        const currentTorrent = torrentManager.getTorrent(torrentId)
        const currentStatus = currentTorrent ? currentTorrent.status : data.status
        window.torrentControl.showContextMenu(torrentId, currentStatus)
    })
})

// Listen for torrent data updates
window.interfaceApi.updateTorrentProgress((event, torrentId, progress) => {
    torrentManager.updateTorrent(torrentId, { progress });
    updateTorrentDOM(torrentId, { progress });
})

window.interfaceApi.updateTorrentSpeed((event, torrentId, speed) => {
    const formattedSpeed = typeof speed === 'number' ? formatBytes(speed, 0) + '/s' : speed;
    torrentManager.updateTorrent(torrentId, { speed: formattedSpeed });
    updateTorrentDOM(torrentId, { speed: formattedSpeed });
})

window.interfaceApi.updateTorrentPeers((event, torrentId, connected, total) => {
    const peersString = `${connected} (${total})`;
    torrentManager.updateTorrent(torrentId, { peers: peersString });
    updateTorrentDOM(torrentId, { peers: peersString });
})

window.interfaceApi.updateTorrentStatus((event, torrentId, status) => {
    torrentManager.updateTorrent(torrentId, { status });
    updateTorrentDOM(torrentId, { status });
})

window.interfaceApi.updateTorrentName((event, torrentId, name) => {
    torrentManager.updateTorrent(torrentId, { name });
    updateTorrentDOM(torrentId, { name });
})

window.interfaceApi.updateTorrentSize((event, torrentId, bytes) => {
    const formattedSize = formatBytes(bytes);
    torrentManager.updateTorrent(torrentId, { size: formattedSize });
    updateTorrentDOM(torrentId, { size: formattedSize });
})

window.interfaceApi.updateTorrentData((event, torrentId, torrentData) => {
    const updated = torrentManager.updateTorrent(torrentId, torrentData);
    if (updated) {
        updateTorrentDOM(torrentId, torrentData);
    }
})

window.interfaceApi.removeTorrentFromList((event, torrentId) => {
    const torrentElement = document.getElementById(torrentId);
    if (torrentElement) {
        torrentElement.remove();
    }
    torrentManager.removeTorrent(torrentId);
    updateEmptyState();
})

window.interfaceApi.changeThemeColors((event, primaryColor, secondaryColor) => {
    document.documentElement.style.setProperty("--surface", primaryColor)
    document.documentElement.style.setProperty("--muted", secondaryColor)
})
