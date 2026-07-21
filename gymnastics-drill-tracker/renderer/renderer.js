import * as drillListView from "./drill-list-view.js"
import * as addEditDrillView from "./add-edit-drill-view.js"

export let drills = []

// event data
export const eventData = {
    "Vault": {
        backgroundColor: "rgb(108, 67, 241)"
    },
    "Bars": {
        backgroundColor: "rgb(108, 67, 241)"
    },
    "Beam": {
        backgroundColor: "rgb(108, 67, 241)"
    },
    "Floor": {
        backgroundColor: "rgb(108, 67, 241)"
    },
    "Tumble Track": {
        backgroundColor: "rgb(108, 67, 241)"
    },
}

// level data
export const levelData = {
    "Tumble Bears": {
        backgroundColor: "rgb(63, 181, 144)"
    },
    "Burgundy": {
        backgroundColor: "rgb(130, 22, 60)"
    },
    "Red": {
        backgroundColor: "rgb(216, 32, 32)"
    },
    "Tan": {
        backgroundColor: "rgb(201, 153, 127)"
    }
}

export async function getDrills() {
    drills = await window.ipcRenderer.invoke("getDrills")
}

export function getDrill(drillName) {
    return drills.find(d => d.name === drillName)
}

export async function saveDrills() {
    await window.ipcRenderer.invoke("saveDrills", drills)
}

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

// open drills list
openDrillListView()