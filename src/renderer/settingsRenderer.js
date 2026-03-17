import '../css/styles.css'
import '../css/settings.css'

const generalPageButton = document.getElementById('generalPageButton')
const downloadsPageButton = document.getElementById('downloadsPageButton')
const appearancePageButton = document.getElementById('appearancePageButton')
const advancedPageButton = document.getElementById('advancedPageButton')

const generalPage = document.getElementById('generalPage')
const downloadsPage = document.getElementById('downloadsPage')
const appearancePage = document.getElementById('appearancePage')
const advancedPage = document.getElementById('advancedPage')

const darkModeToggleButton = document.getElementById('darkModeCheckbox')
const themeSelect = document.getElementById('themeSelect')
const addButton = document.getElementById('addButton')

const primaryColorPicker = document.getElementById('primaryColor')
const secondaryColorPicker = document.getElementById('secondaryColor') 

document.addEventListener("DOMContentLoaded", async () => {
    let loadedSettings = await window.jsonApi.loadSettings()
    darkModeToggleButton.checked = loadedSettings.appearance.darkMode
    
    let activeTheme = undefined
    for (let i = 0; i < loadedSettings.appearance.themes.length; i++) {
    	const theme = loadedSettings.appearance.themes[i]
	if (theme.active == true) {
	   activeTheme = theme
	}
    }

    if (activeTheme == undefined) {
    	activeTheme = {
	    id: 0,
	    primaryColor: "#8549c3",
	    secondaryColor: "#9c5edb", 
	    default: false,
	    active: true,
	}
    }

    primaryColorPicker.value = activeTheme.primaryColor 
    secondaryColorPicker.value = activeTheme.secondaryColor
    document.documentElement.style.setProperty("--surface", activeTheme.primaryColor)
    document.documentElement.style.setProperty("--muted", activeTheme.secondaryColor)
    for (let i = 0; i < loadedSettings.appearance.themes.length; i++) {
    	const theme = loadedSettings.appearance.themes[i]
	createThemeCircle(theme)
    }
    
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

    darkModeToggleButton.addEventListener("change", () => {
	window.darkModeApi.toggleDarkMode()
    })

    primaryColorPicker.addEventListener("input", () => {
	const activeCircle = document.querySelector(".theme-circle.active")
	let theme = JSON.parse(activeCircle.dataset.theme)
	theme.primaryColor = primaryColorPicker.value
	activeCircle.style.background = `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
	changeThemeColors(theme)
	activeCircle.dataset.theme = JSON.stringify(theme)
    })


    secondaryColorPicker.addEventListener("input", () => {
	const activeCircle = document.querySelector(".theme-circle.active")
	let theme = JSON.parse(activeCircle.dataset.theme)
	theme.secondaryColor = secondaryColorPicker.value
	activeCircle.style.background = `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
	changeThemeColors(theme)
	activeCircle.dataset.theme = JSON.stringify(theme)
    })

    addButton.addEventListener("click", () => {
	const defaultTheme = {
	    id: themeSelect.children.length + 1,
	    primaryColor: "#8549c3",
	    secondaryColor: "#9c5edb", 
	    active: true,
	    default: false,
	}
	turnOffAllActiveCircles()
	createThemeCircle(defaultTheme)
    })
})

window.addEventListener("beforeunload", async () => {
    try {
    	
    let themes = []
	const defaultThemes = [
	    {
                "id": 1,
                "primaryColor": "#8549c3",
                "secondaryColor": "#9c5edb",
		"active": false,
		"default": true,
            },

	]

	for (let i = 0; i < defaultThemes.length; i++) {
		const singleTheme = defaultThemes[i];
		// FIX:
		//singleTheme.active = themeSelect.children.item(i).contains("active") ? true : false
		themes.push(singleTheme)
	}

	for (let i = defaultThemes.length; i < themeSelect.children.length; i++) {
		let option = themeSelect.children.item(i)
		let theme = JSON.parse(option.dataset.theme)
		theme.default = false
		theme.active = false
		if(option.classList.contains("active")) {
		    theme.active = true
		}
		themes.push(theme)
	}

	let settings = {
	    general: {
	    },
	    downloads: {
	    },
	    appearance: {
		darkMode: darkModeToggleButton.checked,
		themes: themes,
	    },
	    advanced: {
	    },
	}
	await window.jsonApi.saveSettingsToJSON(settings)
    } catch (error) {
	await window.errorApi.throwErr(error)
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

function turnOffPageButtons() {
	generalPageButton.classList.remove("active")
	downloadsPageButton.classList.remove("active")
	appearancePageButton.classList.remove("active")
	advancedPageButton.classList.remove("active")

	generalPage.classList.add("hidden")
	downloadsPage.classList.add("hidden")
	appearancePage.classList.add("hidden")
	advancedPage.classList.add("hidden")

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
	changeThemeColors(theme)

	//const currentTheme = JSON.parse(circle.dataset.theme)
	//currentTheme.active = true
	//circle.dataset.theme = JSON.stringify(currentTheme)
	//circle.classList.add("active")
    })
    /*
    circle.addEventListener("contextmenu", async () => {
	const circleTheme = JSON.parse(circle.dataset.theme)
	if (circleTheme.default == false) {
	    await window.themeApi.themeCircleContextMenu(circleTheme.id)
	}
    })
    */
    themeSelect.appendChild(circle)
}

function changeThemeColors(theme) {
	primaryColorPicker.value = theme.primaryColor
	secondaryColorPicker.value = theme.secondaryColor
	document.documentElement.style.setProperty("--surface", theme.primaryColor)
	document.documentElement.style.setProperty("--muted", theme.secondaryColor)
	window.themeApi.changeMainWindowColor(theme.primaryColor, theme.secondaryColor)
}
