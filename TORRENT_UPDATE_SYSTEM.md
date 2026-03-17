# Torrent Data Update System

## Overview
A complete system for managing and updating torrent data in the renderer process with real-time DOM updates.

## Components

### TorrentManager Class
Manages the state of all torrents in memory.

**Methods:**
- `addTorrent(torrentId, torrentName, torrentData)` - Add a new torrent
- `updateTorrent(torrentId, updates)` - Update specific properties
- `getTorrent(torrentId)` - Retrieve torrent data
- `getAllTorrents()` - Get all tracked torrents
- `removeTorrent(torrentId)` - Remove a torrent

**Example:**
```javascript
torrentManager.addTorrent('torrent123', 'My Download', {
    size: '1.2 GB',
    progress: 45,
    speed: '500 KB/s',
    peers: '3 (5)',
    status: 'Downloading'
});

torrentManager.updateTorrent('torrent123', { progress: 50, speed: '600 KB/s' });
```

### Update Functions
Individual IPC listeners for specific torrent properties:
- `updateTorrentProgress` - Update download progress (%)
- `updateTorrentSpeed` - Update download speed
- `updateTorrentPeers` - Update connected and total peers
- `updateTorrentStatus` - Update torrent status
- `updateTorrentSize` - Update torrent size
- `updateTorrentData` - Update multiple properties at once
- `removeTorrentFromList` - Remove torrent from UI and manager

### Helper Functions
- `formatBytes(bytes, decimals)` - Convert bytes to human-readable format
- `updateTorrentDOM(torrentId, torrentData)` - Update DOM elements with new data

## Usage in Main Process

From your main.js, emit updates like this:

```javascript
// Update single property
mainWindow.webContents.send('updateTorrentProgress', 'torrentId', 75);
mainWindow.webContents.send('updateTorrentSpeed', 'torrentId', 512000); // bytes/s
mainWindow.webContents.send('updateTorrentPeers', 'torrentId', 5, 10);
mainWindow.webContents.send('updateTorrentStatus', 'torrentId', 'Downloading');
mainWindow.webContents.send('updateTorrentSize', 'torrentId', 1288490188); // total bytes

// Update multiple properties at once
mainWindow.webContents.send('updateTorrentData', 'torrentId', {
    progress: 50,
    speed: '500 KB/s',
    peers: '3 (5)',
    status: 'Downloading'
});

// Remove from list
mainWindow.webContents.send('removeTorrentFromList', 'torrentId');
```

## Example Integration with WebTorrent

```javascript
client.add(magnetUri, (torrent) => {
    const torrentId = torrent.infoHash;
    mainWindow.webContents.send('addTorrentToList', {
        torrentName: torrent.name,
        size: formatBytes(torrent.length),
        progress: 0
    });

    // Update periodically
    const updateInterval = setInterval(() => {
        if (!torrent.done) {
            const connectedPeers = torrent.numPeers;
            const totalPeers = torrent.discovered;
            
            mainWindow.webContents.send('updateTorrentData', torrentId, {
                progress: Math.round(torrent.progress * 100),
                speed: torrent.downloadSpeed,
                peers: `${connectedPeers} (${totalPeers})`,
                status: 'Downloading'
            });
        } else {
            mainWindow.webContents.send('updateTorrentStatus', torrentId, 'Completed');
            clearInterval(updateInterval);
        }
    }, 1000); // Update every second
});
```

## DOM Structure
The system expects torrent list items with this structure:
```html
<div id="torrentList">
    <div id="TORRENT_ID" class="list-row">
        <div class="col" id="name">Torrent Name</div>
        <div class="col" id="size">1.2 GB</div>
        <div class="col" id="progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width:50%"></div>
            </div>
        </div>
        <div class="col" id="speed">500 KB/s</div>
        <div class="col" id="peer">3 (5)</div>
        <div class="col" id="status">Downloading</div>
    </div>
</div>
```

## Benefits
- ✅ In-memory torrent data management
- ✅ Efficient DOM updates (only changed elements)
- ✅ Flexible update methods (single property or batch)
- ✅ Automatic byte formatting
- ✅ Scalable to hundreds of torrents
- ✅ Clean separation of concerns
