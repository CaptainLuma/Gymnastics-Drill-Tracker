import { openConfirmModal, moveToFront, displayAlert, clearAlerts } from "./helpers.js"
import * as renderer from "./renderer.js"

let addEditMode = "add"
let editDrillOriginalName = ""

// add edit page elements
const drillListView = document.getElementById("drill_list_view")
const addEditDrillView = document.getElementById("add_edit_drill_view")

const addEditDrillHeader = document.getElementById("add_edit_drill_header")
const addEditDrillForm = {
    name: document.getElementById("input_drill_name"),
    description: document.getElementById("input_drill_description")
}

const formEventButtonsElement = document.getElementById("form_event_buttons")
const formLevelButtonsElement = document.getElementById("form_level_buttons")
let formEventButtonsData = [] // contains data about each form event button, including wether it has been selected or not
let formLevelButtonsData = [] // contains data about each level event button, including wether it has been selected or not

// main buttons
const addEditSubmitButton = document.getElementById("add_edit_drill_submit")
const returnButton = document.getElementById("return_button")
const deleteDrillButton = document.getElementById("delete_drill_button")

// alerts
const addEditDrillAlerts = document.getElementById("add_edit_drill_alert_container")
const alertSeverities = {
    info: "alert_info",
    danger: "alert_danger"
}

// modal elements
const confirmModalContainer = document.getElementById("confirm_modal_outer_container")

export function openDrillForm(drillName = null) {
    // save drills
    renderer.saveDrills()

    // clear alerts
    addEditDrillAlerts.innerHTML = ""

    // clear form values
    addEditDrillForm.name.value = ""
    addEditDrillForm.description.value = ""

    let drill = drillName != null ? renderer.getDrill(drillName) : null
    editDrillOriginalName = drillName

    // instantiate event buttons
    formEventButtonsElement.innerHTML = ""
    formEventButtonsData = []
    for (const event of Object.keys(renderer.eventData)) {
        let element = document.createElement("button")
        element.classList.add("event_button")
        element.innerText = event
        formEventButtonsElement.appendChild(element)
        formEventButtonsData.push({
            element: element,
            eventName: event,
            selected: false
        })
    }

    // instantiate level buttons
    formLevelButtonsElement.innerHTML = ""
    formLevelButtonsData = []
    for (const level of Object.keys(renderer.levelData)) {
        let element = document.createElement("button")
        element.classList.add("level_button")
        element.innerText = level
        formLevelButtonsElement.appendChild(element)
        formLevelButtonsData.push({
            element: element,
            levelName: level,
            selected: false
        })
    }

    if (!drill) {
        // open add new drill form
        addEditDrillHeader.innerHTML = "Add Drill"
        addEditSubmitButton.innerHTML = "Create"
        deleteDrillButton.hidden = true
        addEditMode = "add"
    } else {
        // open edit drill form
        addEditDrillHeader.innerHTML = "Edit Drill"
        addEditSubmitButton.innerHTML = "Edit"
        deleteDrillButton.hidden = false
        addEditMode = "edit"

        // auto fill values
        addEditDrillForm.name.value = drill.name
        addEditDrillForm.description.value = drill.description

        // set event buttons to active for events included in this drill
        formEventButtonsData.forEach(buttonData => {
            if (drill.events ? drill.events.includes(buttonData.eventName) : false) {
                buttonData.selected = true
                // update button UI
                buttonData.element.classList.add("event_button_selected")
                if (renderer.eventData[buttonData.eventName])
                    buttonData.element.style.backgroundColor = renderer.eventData[buttonData.eventName].backgroundColor
            }
        })

        // set level buttons to active for levels included in this drill
        formLevelButtonsData.forEach(buttonData => {
            if (drill.levels ? drill.levels.includes(buttonData.levelName) : false) {
                buttonData.selected = true
                // update button UI
                buttonData.element.classList.add("level_button_selected")
                if (renderer.levelData[buttonData.levelName])
                    buttonData.element.style.backgroundColor = renderer.levelData[buttonData.levelName].backgroundColor
            }
        })
    }

    drillListView.hidden = true
    addEditDrillView.hidden = false
}

addEditSubmitButton.addEventListener("click", async (event) => {
    // Add/Edit Drill

    clearAlerts(addEditDrillAlerts)

    // get form data
    const drill = {
        name: addEditDrillForm.name.value,
        description: addEditDrillForm.description.value,
        events: formEventButtonsData.filter(x => x.selected).map(x => x.eventName),
        levels: formLevelButtonsData.filter(x => x.selected).map(x => x.levelName)
    }

    // validate input
    if (drill.name.trim() == "") {
        displayAlert(addEditDrillAlerts, "Drill name cannot be empty.", alertSeverities.danger)
        return
    }

    if (addEditMode == "edit") {
        // ensure that drill exists
        if (!renderer.getDrill(editDrillOriginalName)) {
            displayAlert(addEditDrillAlerts, "This drill couldn't be found. Please return to the drill list and try again.", alertSeverities.danger)
            return
        }

        // if name has been changed, make sure the new name is not in use
        if (editDrillOriginalName !== drill.name && renderer.getDrill(drill.name)) {
            displayAlert(addEditDrillAlerts, "There is already a drill with this name. Please choose another name", alertSeverities.danger)
            return
        }

        // edit drill
        renderer.editDrill(editDrillOriginalName, drill)
    } else { // add mode
        // ensure that drill doesn't exist
        if (renderer.getDrill(drill.name)) {
            displayAlert(addEditDrillAlerts, "There is already a drill with this name. Please choose another name", alertSeverities.danger)
            return
        }

        // add drill
        renderer.addDrill(drill)
    }

    await renderer.saveDrills() // TODO: stay on page and display error message if saving fails
    console.log("succesfully saved added or edited drill")

    // return to main list
    renderer.openDrillListView()
})

returnButton.addEventListener("click", (event) => {
    renderer.openDrillListView()
})

deleteDrillButton.addEventListener("click", async (event) => {
    // open delete modal
    const responce = await openConfirmModal(confirmModalContainer, `Are you sure you want to delete the drill\n"${editDrillOriginalName}"?`)
    if (responce) {
        // TODO: create backup of drills.json

        // delete the drill
        renderer.removeDrill(editDrillOriginalName)
        
        // save
        await renderer.saveDrills()

        // return to drill list
        renderer.openDrillListView()
    }
})

formEventButtonsElement.addEventListener("click", (e) => {
    if (e.target.classList.contains("event_button")) {
        const buttonData = formEventButtonsData.find(x => x.element == e.target)
        if (buttonData) {
            buttonData.selected = !buttonData.selected
            // update button UI (background color)
            if (buttonData.selected) {
                buttonData.element.classList.add("event_button_selected")
                buttonData.element.style.backgroundColor = renderer.eventData[buttonData.eventName].backgroundColor
            } else {
                buttonData.element.classList.remove("event_button_selected")
                buttonData.element.style.removeProperty("background-color");
            }
        }
    }
})

formLevelButtonsElement.addEventListener("click", (e) => {
    if (e.target.classList.contains("level_button")) {
        const buttonData = formLevelButtonsData.find(x => x.element == e.target)
        if (buttonData) {
            buttonData.selected = !buttonData.selected
            // update button UI (background color)
            if (buttonData.selected) {
                buttonData.element.classList.add("level_button_selected")
                buttonData.element.style.backgroundColor = renderer.levelData[buttonData.levelName].backgroundColor
            } else {
                buttonData.element.classList.remove("level_button_selected")
                buttonData.element.style.removeProperty("background-color");
            }
        }
    }
})