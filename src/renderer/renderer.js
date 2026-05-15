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
            size: torrentData.size || 'Neznámo',
            progress: torrentData.progress || 0,
            speed: torrentData.speed || '0 B/s',
            peers: torrentData.peers || '0 (0)',
            status: torrentData.status || 'Čekání',
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
        const progressText = torrentElement.querySelector('.progress-text');
        if (progressText) {
            progressText.innerText = `${torrentData.progress}%`;
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
};

const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Context menu for torrents
let currentContextMenu = null;

const showContextMenu = (event, torrentId, torrentName) => {
    // Remove old menu if exists
    if (currentContextMenu) {
        currentContextMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';

    const torrent = torrentManager.getTorrent(torrentId);
    const isPaused = torrent && torrent.status === 'Pozastaveno';

    const menuItems = [
        isPaused 
            ? { label: 'Obnovit', action: () => resumeTorrentAction(torrentId) }
            : { label: 'Pozastavit', action: () => pauseTorrentAction(torrentId) },
        { label: 'Kopírovat název', action: () => copyToClipboard(torrentName) },
        { label: 'Odstranit', action: () => removeTorrent(torrentId), danger: true }
    ];

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item' + (item.danger ? ' danger' : '');
        menuItem.innerText = item.label;
        menuItem.addEventListener('click', () => {
            item.action();
            menu.remove();
            currentContextMenu = null;
        });
        menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);
    currentContextMenu = menu;

    // Close menu when clicking elsewhere
    const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target.id !== 'torrentList') {
            menu.remove();
            currentContextMenu = null;
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 0);
};

const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard:', text);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
};

const removeTorrent = (torrentId) => {
    const torrentElement = document.getElementById(torrentId);
    if (torrentElement) {
        if (confirm('Opravdu chceš odstranit tento torrent?')) {
            window.torrentControl.removeTorrent(torrentId);
        }
    }
};

const pauseTorrentAction = (torrentId) => {
    window.torrentControl.pauseTorrent(torrentId);
};

const resumeTorrentAction = (torrentId) => {
    window.torrentControl.resumeTorrent(torrentId);
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
    
    // Add event listeners for external links
    const links = document.querySelectorAll('a[href^="http"]')
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault()
            const url = link.getAttribute('href')
            if (window.externalLinks) {
                window.externalLinks.openUrl(url)
            }
        })
    })
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
if (!torrentList) {
    console.error('ERROR: torrentList element not found!')
}

console.log('Setting up addTorrentToList listener...')

window.interfaceApi.addTorrentToList((event, data) => {
    console.log('Received addTorrentToList event:', data)
    
    if (!torrentList) {
        console.error('ERROR: torrentList is not available')
        return
    }
    
    const torrentId = data.torrentId;
    
    // Add to torrent manager
    torrentManager.addTorrent(torrentId, data.torrentName, {
        size: data.size || 'Výpočet...',
        progress: data.progress || 0,
        speed: data.speed || '0 B/s',
        peers: data.peers || '0 (0)',
        status: data.status || 'Připojování...'
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
    torrentSizeCol.innerText = data.size || 'Výpočet...'
    
    let torrentProgressCol = document.createElement('div')
    torrentProgressCol.classList.add('col')
    torrentProgressCol.id = 'progress'
    torrentProgressCol.innerHTML = 
	`
	<div class="progress-bar">
	    <div class="progress-fill" style="width:${data.progress || 0}%"></div>
	    <span class="progress-text">${data.progress || 0}%</span>
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
    torrentStatusCol.innerText = data.status || 'Připojování...'
    
    torrentDiv.appendChild(torrentNameCol)
    torrentDiv.appendChild(torrentSizeCol)
    torrentDiv.appendChild(torrentProgressCol)
    torrentDiv.appendChild(torrentSpeedCol)
    torrentDiv.appendChild(torrentPeerCol)
    torrentDiv.appendChild(torrentStatusCol)

    torrentList.appendChild(torrentDiv)
    console.log('Torrent div created and appended:', torrentId)
    
    // Hide empty state when first torrent is added
    const emptyState = document.getElementById('emptyState')
    if (emptyState) {
        emptyState.style.display = 'none'
    }
    
    // Add context menu listener for right-click
    torrentDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        showContextMenu(e, torrentId, data.torrentName)
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

window.interfaceApi.updateTorrentSize((event, torrentId, bytes) => {
    const formattedSize = formatBytes(bytes);
    torrentManager.updateTorrent(torrentId, { size: formattedSize });
    updateTorrentDOM(torrentId, { size: formattedSize });
})

window.interfaceApi.updateTorrentData((event, torrentId, torrentData) => {
    const updated = torrentManager.updateTorrent(torrentId, torrentData);
    if (updated) {
        updateTorrentDOM(torrentId, torrentData);
        updateStatusBar(); // Update status bar on torrent data change
    }
})

window.interfaceApi.removeTorrentFromList((event, torrentId) => {
    const torrentElement = document.getElementById(torrentId);
    if (torrentElement) {
        torrentElement.remove();
    }
    torrentManager.removeTorrent(torrentId);
    updateStatusBar(); // Update status bar when torrent is removed
    
    // Show empty state if no torrents left
    const torrents = torrentManager.getAllTorrents();
    if (torrents.length === 0) {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    }
})

window.interfaceApi.changeThemeColors((event, primaryColor, secondaryColor) => {
    document.documentElement.style.setProperty("--surface", primaryColor)
    document.documentElement.style.setProperty("--muted", secondaryColor)
})

// Status bar update function
const updateStatusBar = () => {
    const statusLeft = document.querySelector('.status-left')
    const statusCenter = document.querySelector('.status-center')
    
    if (!statusLeft || !statusCenter) return
    
    const torrents = torrentManager.getAllTorrents()
    
    // Calculate total speed (in Bytes per second)
    let totalDownloadSpeed = 0
    let totalUploadSpeed = 0
    let totalPeers = 0
    let activeTorrents = 0
    
    torrents.forEach(torrent => {
        // Extract speed value from formatted string (e.g., "5 MB/s" -> 5242880)
        const speedMatch = torrent.speed.match(/^([\d.]+)\s+([KMGT]?B)/);
        if (speedMatch) {
            const value = parseFloat(speedMatch[1]);
            const unit = speedMatch[2];
            const multipliers = { 'B': 1, 'KB': 1024, 'MB': 1048576, 'GB': 1073741824, 'TB': 1099511627776 };
            totalDownloadSpeed += value * (multipliers[unit] || 1);
        }
        
        // Extract peer count from "X (Y)" format
        const peersMatch = torrent.peers.match(/^(\d+)/);
        if (peersMatch) {
            totalPeers += parseInt(peersMatch[1]);
        }
        
        if (torrent.status === 'Stahování' || torrent.status === 'Sdílení') {
            activeTorrents++
        }
    })
    
    // Format speeds
    const downloadText = formatBytes(totalDownloadSpeed, 0) + '/s'
    const uploadText = formatBytes(totalUploadSpeed, 0) + '/s'
    
    statusLeft.innerText = `\u2B0B: ${downloadText} \u2191: ${uploadText}`
    statusCenter.innerText = `Aktivní: ${activeTorrents} | Celkem peerů: ${totalPeers}`
}

// Update status bar every second
setInterval(updateStatusBar, 1000)
