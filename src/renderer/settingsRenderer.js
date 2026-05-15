import '../css/styles.css'
import '../css/settings.css'

// Default themes collection
const DEFAULT_THEMES = [
    {
        id: 1,
        primaryColor: "#8549c3",
        secondaryColor: "#9c5edb",
        active: false,
        default: true,
        name: "Purple"
    },
    {
        id: 2,
        primaryColor: "#60a53b",
        secondaryColor: "#8bc34a",
        active: false,
        default: true,
        name: "Green"
    },
    {
        id: 3,
        primaryColor: "#2196f3",
        secondaryColor: "#42a5f5",
        active: false,
        default: true,
        name: "Blue"
    },
    {
        id: 4,
        primaryColor: "#ff6f00",
        secondaryColor: "#ffb74d",
        active: false,
        default: true,
        name: "Orange"
    },
    {
        id: 5,
        primaryColor: "#d32f2f",
        secondaryColor: "#ef5350",
        active: false,
        default: true,
        name: "Red"
    }
]

// Default settings structure
const DEFAULT_SETTINGS = {
    general: {
        startOnLaunch: false,
        confirmBeforeExit: true
    },
    downloads: {
        downloadFolder: '',
        autoStart: false
    },
    appearance: {
        darkMode: false,
        themes: DEFAULT_THEMES.map(t => ({...t}))
    },
    advanced: {
        history: {
            torrents: [],
            maxSize: 100,
            enabled: true
        }
    }
}

const generalPageButton = document.getElementById('generalPageButton')
const downloadsPageButton = document.getElementById('downloadsPageButton')
const appearancePageButton = document.getElementById('appearancePageButton')
const advancedPageButton = document.getElementById('advancedPageButton')
const aboutPageButton = document.getElementById('aboutPageButton')

const generalPage = document.getElementById('generalPage')
const downloadsPage = document.getElementById('downloadsPage')
const appearancePage = document.getElementById('appearancePage')
const advancedPage = document.getElementById('advancedPage')
const aboutPage = document.getElementById('aboutPage')

const startOnLaunchCheckbox = document.getElementById('startOnLaunchCheckbox')
const confirmBeforeExitCheckbox = document.getElementById('confirmBeforeExitCheckbox')
const browseDownloadFolder = document.getElementById('browseDownloadFolder')
const downloadFolderDisplay = document.getElementById('downloadFolderDisplay')
const autoStartTorrentsCheckbox = document.getElementById('autoStartTorrentsCheckbox')

const darkModeToggleButton = document.getElementById('darkModeCheckbox')
const themeSelect = document.getElementById('themeSelect')
const addButton = document.getElementById('addButton')

const primaryColorPicker = document.getElementById('primaryColor')
const secondaryColorPicker = document.getElementById('secondaryColor')

const exportSettingsButton = document.getElementById('exportSettingsButton')
const resetDefaultsButton = document.getElementById('resetDefaultsButton')

// History elements
const historyEnabledCheckbox = document.getElementById('historyEnabledCheckbox')
const historyMaxSize = document.getElementById('historyMaxSize')
const clearHistoryButton = document.getElementById('clearHistoryButton')
const historyList = document.getElementById('historyList')

// History data stored in memory
let currentHistoryData = []

document.addEventListener("DOMContentLoaded", async () => {
    let loadedSettings = await window.jsonApi.loadSettings()
    
    // Initialize general settings
    startOnLaunchCheckbox.checked = loadedSettings.general?.startOnLaunch || false
    confirmBeforeExitCheckbox.checked = loadedSettings.general?.confirmBeforeExit ?? true
    
    // Initialize download settings
    const downloadFolder = loadedSettings.downloads?.downloadFolder || (await window.fileApi.getDefaultDownloadsFolder())
    displayDownloadFolder(downloadFolder)
    autoStartTorrentsCheckbox.checked = loadedSettings.downloads?.autoStart || false
    
    // Initialize dark mode
    darkModeToggleButton.checked = loadedSettings.appearance.darkMode
    
    // Initialize history settings
    const historySettings = loadedSettings.advanced?.history || DEFAULT_SETTINGS.advanced.history
    historyEnabledCheckbox.checked = historySettings.enabled ?? true
    historyMaxSize.value = historySettings.maxSize || 100
    displayTorrentHistory(historySettings.torrents || [])
    
    // Ensure all default themes are in the loaded settings
    let themesMap = new Map()
    
    // Add/update loaded themes
    loadedSettings.appearance.themes.forEach(theme => {
        themesMap.set(theme.id, theme)
    })
    
    // Add any missing default themes
    DEFAULT_THEMES.forEach(defaultTheme => {
        if (!themesMap.has(defaultTheme.id)) {
            themesMap.set(defaultTheme.id, {...defaultTheme})
        }
    })
    
    // Convert back to array and sort by id
    const allThemes = Array.from(themesMap.values()).sort((a, b) => a.id - b.id)
    
    let activeTheme = undefined
    for (let i = 0; i < allThemes.length; i++) {
    	const theme = allThemes[i]
	if (theme.active == true) {
	   activeTheme = theme
	}
    }

    // If no active theme, set the first default theme as active
    if (activeTheme == undefined) {
    	activeTheme = DEFAULT_THEMES[0]
        activeTheme.active = true
    }

    primaryColorPicker.value = activeTheme.primaryColor 
    secondaryColorPicker.value = activeTheme.secondaryColor
    document.documentElement.style.setProperty("--surface", activeTheme.primaryColor)
    document.documentElement.style.setProperty("--muted", activeTheme.secondaryColor)
    
    for (let i = 0; i < allThemes.length; i++) {
    	const theme = allThemes[i]
	createThemeCircle(theme)
    }
    
    // Page navigation
    generalPageButton.addEventListener("click", () => {
	turnOffPageButtons()
	generalPageButton.classList.add("active")
	generalPage.classList.remove("hidden")
    })

    downloadsPageButton.addEventListener("click", () => {
	turnOffPageButtons()
	downloadsPageButton.classList.add("active")
	downloadsPage.classList.remove("hidden")
    })

    appearancePageButton.addEventListener("click", () => {
	turnOffPageButtons()
	appearancePageButton.classList.add("active")
	appearancePage.classList.remove("hidden")
    })

    advancedPageButton.addEventListener("click", () => {
	turnOffPageButtons()
	advancedPageButton.classList.add("active")
	advancedPage.classList.remove("hidden")
    })

    aboutPageButton.addEventListener("click", () => {
	turnOffPageButtons()
	aboutPageButton.classList.add("active")
	aboutPage.classList.remove("hidden")
    })

    // General settings listeners
    startOnLaunchCheckbox.addEventListener("change", () => {
        // Save will happen on window close
    })

    confirmBeforeExitCheckbox.addEventListener("change", () => {
        // Save will happen on window close
    })

    // Download settings listeners
    browseDownloadFolder.addEventListener("click", async () => {
        const folder = await window.fileApi.selectFolder()
        if (folder) {
            displayDownloadFolder(folder)
        }
    })

    autoStartTorrentsCheckbox.addEventListener("change", () => {
        // Save will happen on window close
    })

    // Dark mode listener
    darkModeToggleButton.addEventListener("change", () => {
		window.darkModeApi.toggleDarkMode()
    })

    // Theme color listeners
    primaryColorPicker.addEventListener("input", () => {
	const activeCircle = document.querySelector(".theme-circle.active")
	let theme = JSON.parse(activeCircle.dataset.theme)
	if (!theme.default) {
	    theme.primaryColor = primaryColorPicker.value
	    activeCircle.style.background = `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
	    changeThemeColors(theme)
	    activeCircle.dataset.theme = JSON.stringify(theme)
	}
    })

    secondaryColorPicker.addEventListener("input", () => {
	const activeCircle = document.querySelector(".theme-circle.active")
	let theme = JSON.parse(activeCircle.dataset.theme)
	if (!theme.default) {
	    theme.secondaryColor = secondaryColorPicker.value
	    activeCircle.style.background = `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
	    changeThemeColors(theme)
	    activeCircle.dataset.theme = JSON.stringify(theme)
	}
    })

    // Add custom theme
    addButton.addEventListener("click", () => {
	let maxId = 99
	const circles = document.querySelectorAll(".theme-circle")
	circles.forEach(circle => {
	    let circleData = JSON.parse(circle.dataset.theme)
	    if (circleData.id > maxId) {
	        maxId = circleData.id
	    }
	})
	
	const defaultTheme = {
	    id: maxId + 1,
	    primaryColor: "#8549c3",
	    secondaryColor: "#9c5edb", 
	    active: true,
	    default: false,
	}
	turnOffAllActiveCircles()
	createThemeCircle(defaultTheme)
    })

    // Advanced settings listeners
    exportSettingsButton.addEventListener("click", async () => {
        try {
            const settings = await window.jsonApi.loadSettings()
            // Remove history before exporting
            const settingsToExport = JSON.parse(JSON.stringify(settings))
            if (settingsToExport.advanced) {
                delete settingsToExport.advanced.history
            }
            await window.fileApi.exportSettings(settingsToExport)
        } catch (error) {
            console.error('Error exporting settings:', error)
        }
    })

    resetDefaultsButton.addEventListener("click", async () => {
        const confirmed = await window.dialogApi.confirm(
            "Obnovit Nastaven\u00ed",
            "Jste si jisti, \u017ee chcete obnovit v\u0161echna nastaven\u00ed na v\u00fdchoz\u00ed hodnoty? Tuto akci nelze vrátit."
        )
        if (confirmed) {
            // Reset all controls to defaults
            startOnLaunchCheckbox.checked = false
            confirmBeforeExitCheckbox.checked = true
            autoStartTorrentsCheckbox.checked = false
            darkModeToggleButton.checked = false
            
            // Reset themes - keep defaults
            themeSelect.innerHTML = ''
            DEFAULT_THEMES.forEach(theme => {
                createThemeCircle({...theme, active: theme.id === 1})
            })
            
            // Save reset settings
            await window.jsonApi.saveSettingsToJSON(DEFAULT_SETTINGS)
            window.darkModeApi.toggleDarkMode() // Ensure dark mode is off
        }
    })

    // History settings listeners
    historyEnabledCheckbox.addEventListener("change", () => {
        // Save will happen on window close
    })

    historyMaxSize.addEventListener("change", () => {
        // Save will happen on window close
    })

    clearHistoryButton.addEventListener("click", async () => {
        const confirmed = await window.dialogApi.confirm(
            "Vymazat historii",
            "Jste si jisti, že chcete vymazat veškerou historii torrentů? Tuto akci nelze vrátit."
        )
        if (confirmed) {
            currentHistoryData = []
            historyList.innerHTML = '<div class="history-empty">Zatím žádná historie</div>'
        }
    })
})

window.addEventListener("beforeunload", async () => {
    try {
    	let themes = []
	
	// First, add all default themes, updating their active state from DOM
	DEFAULT_THEMES.forEach(defaultTheme => {
	    let themeData = {...defaultTheme}
	    themeData.active = false
	    
	    // Check if this theme is currently active in the DOM
	    const circles = document.querySelectorAll(".theme-circle")
	    circles.forEach(circle => {
	        let circleData = JSON.parse(circle.dataset.theme)
	        if (circleData.id === defaultTheme.id && circle.classList.contains("active")) {
	            themeData.active = true
	        }
	    })
	    
	    themes.push(themeData)
	})
	
	// Then, add any custom user-created themes (id > 100 to avoid conflicts with defaults)
	const circles = document.querySelectorAll(".theme-circle")
	circles.forEach(circle => {
	    let circleData = JSON.parse(circle.dataset.theme)
	    if (!circleData.default) {
	        circleData.active = circle.classList.contains("active")
	        // Only add if it's not already in the themes array (skip defaults)
	        if (!themes.find(t => t.id === circleData.id)) {
	            themes.push(circleData)
	        }
	    }
	})

    const downloadFolder = downloadFolderDisplay.querySelector('.folder-path').textContent

	let settings = {
	    general: {
            startOnLaunch: startOnLaunchCheckbox.checked,
            confirmBeforeExit: confirmBeforeExitCheckbox.checked
	    },
	    downloads: {
            downloadFolder: downloadFolder,
            autoStart: autoStartTorrentsCheckbox.checked
	    },
	    appearance: {
		darkMode: darkModeToggleButton.checked,
		themes: themes,
	    },
	    advanced: {
            history: {
                torrents: getHistoryFromUI(),
                maxSize: parseInt(historyMaxSize.value) || 100,
                enabled: historyEnabledCheckbox.checked
            }
	    },
	}
	await window.jsonApi.saveSettingsToJSON(settings)
	
	// Update start on launch setting in the system
	if (window.startupApi) {
	    await window.startupApi.updateStartOnLaunch(startOnLaunchCheckbox.checked)
	}
	
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
    } catch (error) {
	    console.error('Error saving settings:', error)
    }
})

window.themeApi.deleteTheme((event, circleNumber) => {
    console.log(circleNumber)
    let circles = document.getElementsByClassName("theme-circle")
    for (let i = 0; i < circles.length; i++) {
    	const circle = circles[i];
	let circleJson = JSON.parse(circle.dataset.theme)
	if (circleJson.id == circleNumber){
	    circle.remove()
	    return
	}
    }
})

function displayDownloadFolder(folder) {
    const folderPath = downloadFolderDisplay.querySelector('.folder-path')
    folderPath.textContent = folder || ''
}

function turnOffPageButtons() {
	generalPageButton.classList.remove("active")
	downloadsPageButton.classList.remove("active")
	appearancePageButton.classList.remove("active")
	advancedPageButton.classList.remove("active")
	aboutPageButton.classList.remove("active")

	generalPage.classList.add("hidden")
	downloadsPage.classList.add("hidden")
	appearancePage.classList.add("hidden")
	advancedPage.classList.add("hidden")
	aboutPage.classList.add("hidden")
}

function turnOffAllActiveCircles() {
    for (let i = 0; i < themeSelect.children.length; i++) {
	let singleThemeCircle = themeSelect.children.item(i)
	let  singleThemeCircleData = JSON.parse(singleThemeCircle.dataset.theme)
	singleThemeCircleData.active = false
	singleThemeCircle.dataset.theme = JSON.stringify(singleThemeCircleData)
	singleThemeCircle.classList.remove("active")
    }
}

function createThemeCircle(theme) {
    const circle = document.createElement("div")
    circle.classList.add("theme-circle")
    if(theme.active == true){
	console.log(theme.id)
	circle.classList.add("active")
	changeThemeColors(theme)
    }
    circle.style.background = `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
    circle.dataset.theme = JSON.stringify(theme) 
    circle.addEventListener("click", () => {
	turnOffAllActiveCircles()
	let circleData = JSON.parse(circle.dataset.theme)
	circleData.active = true
	circle.dataset.theme = JSON.stringify(circleData)
	circle.classList.add("active")
	changeThemeColors(circleData)
    })
    
    // Add right-click context menu for non-default themes
    if (!theme.default) {
        circle.style.cursor = "context-menu"
        circle.addEventListener("contextmenu", async (event) => {
            event.preventDefault()
            const circleTheme = JSON.parse(circle.dataset.theme)
            await window.themeApi.themeCircleContextMenu(circleTheme.id)
        })
    }
    
    themeSelect.appendChild(circle)
}

function changeThemeColors(theme) {
	primaryColorPicker.value = theme.primaryColor
	secondaryColorPicker.value = theme.secondaryColor
	
	// Disable color pickers for default themes
	if (theme.default) {
	    primaryColorPicker.disabled = true
	    secondaryColorPicker.disabled = true
	} else {
	    primaryColorPicker.disabled = false
	    secondaryColorPicker.disabled = false
	}
	
	document.documentElement.style.setProperty("--surface", theme.primaryColor)
	document.documentElement.style.setProperty("--muted", theme.secondaryColor)
	window.themeApi.changeMainWindowColor(theme.primaryColor, theme.secondaryColor)
}

function displayTorrentHistory(torrents) {
    // Store in memory
    currentHistoryData = [...torrents]
    
    historyList.innerHTML = ''
    
    if (!torrents || torrents.length === 0) {
        historyList.innerHTML = '<div class="history-empty">Zatím žádná historie</div>'
        return
    }
    
    torrents.forEach((torrent, index) => {
        const historyItem = document.createElement('div')
        historyItem.className = 'history-item'
        
        const itemName = document.createElement('div')
        itemName.className = 'history-item-name'
        itemName.textContent = torrent.name || 'Neznámý torrent'
        
        const itemDate = document.createElement('div')
        itemDate.className = 'history-item-date'
        itemDate.textContent = new Date(torrent.addedDate || 0).toLocaleDateString('cs-CZ')
        
        const itemButtons = document.createElement('div')
        itemButtons.className = 'history-item-buttons'
        
        const removeButton = document.createElement('button')
        removeButton.className = 'history-remove-button'
        removeButton.textContent = 'Odebrat'
        removeButton.addEventListener('click', () => {
            // Remove from current history data by finding the matching item
            const itemIndex = currentHistoryData.findIndex(h => 
                h.name === torrent.name && h.addedDate === torrent.addedDate
            )
            if (itemIndex > -1) {
                currentHistoryData.splice(itemIndex, 1)
            }
            historyItem.remove()
            
            // Show empty message if no items left
            if (currentHistoryData.length === 0) {
                displayTorrentHistory([])
            }
        })
        
        itemButtons.appendChild(removeButton)
        
        historyItem.appendChild(itemName)
        historyItem.appendChild(itemDate)
        historyItem.appendChild(itemButtons)
        
        historyList.appendChild(historyItem)
    })
}

function getHistoryFromUI() {
    return currentHistoryData
}
