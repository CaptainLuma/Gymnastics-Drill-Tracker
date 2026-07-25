import { 
    displayAlert, 
    clearAlerts, } from "./helpers.js"

import * as drillListView from "./drill-list-view.js"
import * as addEditDrillView from "./add-edit-drill-view.js"

export let drills = []
export let eventData = {}
export let levelData = {}

export let success = true

// alerts
const drillListAlerts = document.getElementById("drill_list_alert_container")
const alertSeverities = {
    info: "alert_info",
    danger: "alert_danger"
}



export async function getDataFilePath() {
    return await window.ipcRenderer.invoke("getDataFilePath")
}

export async function getDrills() {
    drills = await window.ipcRenderer.invoke("getDrills")

    if (drills == null) {
        // an error has occured
        drills = []
        success = false
        return false
    }
    return true
}

export async function getEvents() {
    eventData = await window.ipcRenderer.invoke("getEvents")

    if (eventData == null) {
        // an error has occured
        eventData = {}
        success = false
        return false
    }
    return true
}

export async function getLevels() {
    levelData = await window.ipcRenderer.invoke("getLevels")

    if (levelData == null) {
        // an error has occured
        levelData = {}
        success = false
        return false
    }
    return true
}

export function getDrill(drillName) {
    return drills.find(d => d.name === drillName)
}

export async function saveDrills() {
    if (success) // don't save if failed to load drills. This could erase data.
        await window.ipcRenderer.invoke("saveDrills", drills)
}

// export async function saveEvents() {
//     if (success)
//         await window.ipcRenderer.invoke("saveEvents", events)
// }

export function removeDrill(drillName) {
    drills = drills.filter(d => d.name !== drillName)
}

export function addDrill(drill) {
    drills.unshift(drill)
}

export function editDrill(drillName, drill) {
    let indexOfDrill = drills.findIndex(d => d.name === drillName)
    drills[indexOfDrill] = drill
}

export function openDrillListView() {
    drillListView.openDrillList()
}

export function openDrillFormView(drill = null) {
    addEditDrillView.openDrillForm(drill)
}

async function initialize() {
    // load event and level data
    let eventsSuccess = await getEvents()
    let levelsSuccess = await getLevels()

    clearAlerts(drillListAlerts)
    if (!eventsSuccess) {
        let filePath = await getDataFilePath()
        displayAlert(drillListAlerts, `An unexpected error occured when loading events. Please check the file path:\n${filePath}`, alertSeverities.danger)
    }

    if (!levelsSuccess) {
        let filePath = await getDataFilePath()
        displayAlert(drillListAlerts, `An unexpected error occured when loading levels. Please check the file path:\n${filePath}`, alertSeverities.danger)
    }

    // initialize pages
    drillListView.onAppStart()
    addEditDrillView.onAppStart()

    // open drills list
    openDrillListView()
}

initialize()