import { 
    displayAlert, 
    clearAlerts, 
    openErrorModal, 
    openConfirmModal
} from "./helpers.js"

import * as drillListView from "./drill-list-view.js"
import * as addEditDrillView from "./add-edit-drill-view.js"

export let drills = [
    {
        name: "This is an example drill",
        description: "This is an example drill. Feel free to edit, or delete it.",
        events: [],
        levels: [],
        pinned: false
    },
]
export let eventData = {}
export let levelData = {}

let loadSuccessful = false

export let drillImagesPath = ""

// alerts
const drillListAlerts = document.getElementById("drill_list_alert_container")
const alertSeverities = {
    info: "alert_info",
    danger: "alert_danger"
}

// modal
const confirmModalContainer = document.getElementById("confirm_modal_outer_container")

window.ipcRenderer.on("saveAndClose", async () => {
    await saveDrills()
    window.ipcRenderer.send("quitApp")
})

export async function getDrills() {
    const retrievedDrills = await window.ipcRenderer.invoke("getDrills")

    if (retrievedDrills == null) {
        return false // an error has occured
    }

    drills = retrievedDrills

    return true
}

export async function getEvents() {
    const retrievedEvents = await window.ipcRenderer.invoke("getEvents")

    if (retrievedEvents == null) {
        return false // an error has occured
    }

    eventData = retrievedEvents

    return true
}

export async function getLevels() {
    const retrievedLevels = await window.ipcRenderer.invoke("getLevels")

    if (retrievedLevels == null) {
        return false // an error has occured
    }

    levelData = retrievedLevels

    return true
}

export function getDrill(drillName) {
    return drills.find(d => d.name === drillName)
}

export async function saveDrills() {
    if (!loadSuccessful) return false // don't save if couldn't successfully load data. This could result in loss of data
    
    return await window.ipcRenderer.invoke("saveDrills", drills)
}

export async function saveEventsAndLevels() {
    if (!loadSuccessful) return
    
    const eventsSaved = await window.ipcRenderer.invoke("saveEvents", eventData)
    const levelsSaved = await window.ipcRenderer.invoke("saveLevels", levelData)

    return eventsSaved && levelsSaved
}

export function removeDrill(drillName) {
    drills = drills.filter(d => d.name !== drillName)
}

export function addDrill(drill) {
    drills.unshift(drill)
}

export function editDrill(drillName, editedDrill) {
    let originalDrill = getDrill(drillName)

    originalDrill.name = editedDrill.name
    originalDrill.description = editedDrill.description
    originalDrill.events = editedDrill.events
    originalDrill.levels = editedDrill.levels
    originalDrill.image = editedDrill.image
}

export function openDrillListView() {
    drillListView.openDrillList()
}

export function openDrillFormView(drill = null) {
    addEditDrillView.openDrillForm(drill)
}

export async function backupFiles() {
    console.log("backing up files")
    await window.ipcRenderer.invoke("backupFiles")
}

export async function getPath(pathElements) {
    return await window.ipcRenderer.invoke("getPath", pathElements)
}

export async function getAndCopyUserSelectedImage() {
    return await window.ipcRenderer.invoke("getAndCopyUserSelectedImage")
}

async function getFileNames(directory) {
    return await window.ipcRenderer.invoke("getFileNames", directory)
}

export async function getDrillImageNames() {
    return await getFileNames(await getPath(["data", "drill-images"]))
}

export async function deleteUnusedImages() {
    let registeredImages = await getDrillImageNames()

    let unusedImages = registeredImages.filter(img => {
        return !drills.some(drill => drill.image == img)
    })

    // delete unused images
    if (unusedImages.length > 0) {
        window.ipcRenderer.invoke("deleteUnusedImages", unusedImages)
            // .then(deletedFileNames => console.log(`deleted ${deletedFileNames.length} unused images.`, deletedFileNames))
    }
}

async function initialize() {
    let drillsFileExists = await window.ipcRenderer.invoke("getFileExists", ["data", "drills.json"])
    let eventsFileExists = await window.ipcRenderer.invoke("getFileExists", ["data", "events.json"])
    let levelsFileExists = await window.ipcRenderer.invoke("getFileExists", ["data", "levels.json"])

    if ((!drillsFileExists) && (!eventsFileExists) && (!levelsFileExists)) {
        let responce = await openConfirmModal(confirmModalContainer, `No data was found on your system.\n Do you wish to create new data?`)

        if (responce) {
            // create new data
            await window.ipcRenderer.invoke("saveDrills", drills)
            await window.ipcRenderer.invoke("saveEvents", eventData)
            await window.ipcRenderer.invoke("saveLevels", levelData)
        } else {
            // alert user of error
            let filePath = await window.ipcRenderer.invoke("getPath", ["data"])
            
            await openErrorModal(confirmModalContainer, `No data was found on your system. Please check the folder:\n"${filePath}"\n`, "Exit")

            window.ipcRenderer.send("quitApp")
            return
        }
    }

    // load event and level data
    let drillsSuccess = await getDrills()
    let eventsSuccess = await getEvents()
    let levelsSuccess = await getLevels()

    if (!drillsSuccess) {
        let filePath = await window.ipcRenderer.invoke("getPath", ["data", "drills.json"])

        await openErrorModal(confirmModalContainer, `An unexpected error occured when loading drills. Please check the file path:\n${filePath}`, "Exit")

        window.ipcRenderer.send("quitApp")
        return
    }

    if (!eventsSuccess) {
        let filePath = await window.ipcRenderer.invoke("getPath", ["data", "events.json"])

        await openErrorModal(confirmModalContainer, `An unexpected error occured when loading events. Please check the file path:\n"${filePath}"`, "Exit")

        window.ipcRenderer.send("quitApp")
        return
    }

    if (!levelsSuccess) {
        let filePath = await window.ipcRenderer.invoke("getPath", ["data", "levels.json"])

        await openErrorModal(confirmModalContainer, `An unexpected error occured when loading levels. Please check the file path:\n${filePath}`, "Exit")

        window.ipcRenderer.send("quitApp")
        return
    }

    loadSuccessful = true

    drillImagesPath = await window.ipcRenderer.invoke("getPath", ["data", "drill-images"])

    // initialize pages
    drillListView.onAppStart()
    addEditDrillView.onAppStart()

    console.log(drills)

    // open drills list
    openDrillListView(false)
}

initialize()