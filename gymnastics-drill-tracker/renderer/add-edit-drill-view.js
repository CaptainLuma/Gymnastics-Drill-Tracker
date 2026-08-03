import { 
    openConfirmModal, 
    displayAlert, 
    clearAlerts,
    rgbToHex,
    hexToRgb } from "./helpers.js"
import * as renderer from "./renderer.js"

let addEditMode = "add"
let editDrillOriginalName = ""
let changesMade = false

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

// image stuff
let formDrillImageFileName = null

const imageContainer = document.getElementById("form_image_container")
const imageButtons = document.getElementById("form_image_buttons")
const imageAddButton = document.getElementById("add_image_button")
const imageRemoveButton = document.getElementById("remove_image_button")
const imageEmptySVG = document.getElementById("form_image_empty_svg")
const imageElement = document.getElementById("form_image")

// main buttons
const addEditSubmitButton = document.getElementById("add_edit_drill_submit")
const cancelButton = document.getElementById("return_button")
const deleteDrillButton = document.getElementById("delete_drill_button")

// alerts
const addEditDrillAlerts = document.getElementById("add_edit_drill_alert_container")
const drillListAlerts = document.getElementById("drill_list_alert_container")
const alertSeverities = {
    info: "alert_info",
    danger: "alert_danger"
}

// modal elements
const confirmModalContainer = document.getElementById("confirm_modal_outer_container")

// add/edit event/level modal elements
const addEventButton = document.getElementById("add_event_button")
const editEventsButton = document.getElementById("edit_events_button")
const addLevelButton = document.getElementById("add_level_button")
const editLevelsButton = document.getElementById("edit_levels_button")
const addEditTagModal = document.getElementById("add_edit_event_level_modal")
const tagModalElements = {
    header: addEditTagModal.querySelector(".modal_header"),
    originalNameSection: addEditTagModal.querySelector("#event_level_original_name_section"),
    originalNameSelectElement: addEditTagModal.querySelector("#event_level_original_name"),
    originalNameLabel: addEditTagModal.querySelector("#event_level_original_name_label"),
    nameInput: addEditTagModal.querySelector("#event_level_name"),
    colorInput: addEditTagModal.querySelector("#event_level_color"),
    cancelButton: addEditTagModal.querySelector(".modal_no_button"),
    createButton: addEditTagModal.querySelector(".modal_yes_button"),
    deleteButton: addEditTagModal.querySelector("#delete_tag_button"),
    alertText: addEditTagModal.querySelector("#add_edit_tag_modal_alert_text")
}

/**
 * actions to be performed only once (when the app starts)
 */
export function onAppStart() {
    
}

export function openDrillForm(drillName = null) {
    // save pinned drills n stuff
    renderer.saveDrills()

    // clear alerts
    clearAlerts(drillListAlerts)
    clearAlerts(addEditDrillAlerts)

    // clear form values
    addEditDrillForm.name.value = ""
    addEditDrillForm.description.value = ""
    formDrillImageFileName = null

    changesMade = false

    let drill = drillName != null ? renderer.getDrill(drillName) : null
    editDrillOriginalName = drillName

    refreshEventAndLevelButtons()

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
        formDrillImageFileName = drill.image

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

    refreshImageThumbnail()

    drillListView.hidden = true
    addEditDrillView.hidden = false
}

function refreshEventAndLevelButtons() {
    // instantiate event buttons
    formEventButtonsElement.innerHTML = ""
    formEventButtonsData = []
    for (const eventID of Object.keys(renderer.eventData)) {
        let element = document.createElement("button")
        element.classList.add("event_button")
        element.innerText = renderer.eventData[eventID].displayName
        formEventButtonsElement.appendChild(element)
        formEventButtonsData.push({
            element: element,
            eventName: eventID,
            selected: false
        })
    }

    // instantiate level buttons
    formLevelButtonsElement.innerHTML = ""
    formLevelButtonsData = []
    for (const levelID of Object.keys(renderer.levelData)) {
        let element = document.createElement("button")
        element.classList.add("level_button")
        element.innerText = renderer.levelData[levelID].displayName
        formLevelButtonsElement.appendChild(element)
        formLevelButtonsData.push({
            element: element,
            levelName: levelID,
            selected: false
        })
    }
}

addEditSubmitButton.addEventListener("click", async (event) => {
    // Add/Edit Drill

    clearAlerts(addEditDrillAlerts)

    // get form data
    const drill = {
        name: addEditDrillForm.name.value,
        description: addEditDrillForm.description.value,
        events: formEventButtonsData.filter(x => x.selected).map(x => x.eventName),
        levels: formLevelButtonsData.filter(x => x.selected).map(x => x.levelName),
        image: formDrillImageFileName
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

    let success = await renderer.saveDrills() // TODO: stay on page and display error message if saving fails

    if (!success) {
        clearAlerts(addEditDrillAlerts)
        displayAlert(addEditDrillAlerts, `An unexpected error occured when trying to save the drill. This could be because another program is using the drills.json file.`, alertSeverities.danger)
        return
    }

    renderer.deleteUnusedImages()

    clearAlerts(drillListAlerts)
    displayAlert(drillListAlerts, `Drill "${drill.name}" has been ${addEditMode == "edit" ? "edited" : "added"}.`, alertSeverities.info)

    // return to main list
    renderer.openDrillListView()
})

cancelButton.addEventListener("click", async (event) => {
    
    if (changesMade) {
        // ask user to confirm action
        const response = await openConfirmModal(confirmModalContainer, "Return to Drill List?\nYour changes won't be saved.")
        if (response) {
            renderer.openDrillListView()
        }
    } else {
        renderer.openDrillListView()
    }
})

deleteDrillButton.addEventListener("click", async (event) => {
    // open delete modal
    const responce = await openConfirmModal(confirmModalContainer, `Are you sure you want to delete the drill\n"${editDrillOriginalName}"?`)
    if (responce) {
        // TODO: create backup of drills.json

        renderer.removeDrill(editDrillOriginalName)

        await renderer.saveDrills()

        renderer.deleteUnusedImages()

        clearAlerts(drillListAlerts)
        displayAlert(drillListAlerts, `Drill "${editDrillOriginalName}" has been deleted.`, alertSeverities.info)

        // return to drill list
        renderer.openDrillListView()
    }
})

formEventButtonsElement.addEventListener("click", (e) => {
    changesMade = true
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
    changesMade = true
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

addEditDrillForm.name.addEventListener("change", () => changesMade = true)
addEditDrillForm.description.addEventListener("change", () => changesMade = true)



// add/edit event/level stuff

function openAddEditEventLevelModal(type, mode) {
    // ensure that type is either "event" or "level" and mode is either "add" or "edit"
    type = type == "event" ? "event" : "level"
    mode = mode == "add" ? "add" : "edit"

    addEditTagModal.hidden = false
    tagModalElements.alertText.hidden = true
    addEditTagModal.dataset.type = type
    addEditTagModal.dataset.mode = mode

    const typeCapitalized = type == "event" ? "Event" : "Level"
    const modeCapitalized = mode == "add" ? "Add" : "Edit"

    tagModalElements.header.innerText = `${modeCapitalized} ${typeCapitalized}`
    tagModalElements.originalNameLabel.innerText = `${typeCapitalized} to edit:`
    tagModalElements.originalNameSection.hidden = mode != "edit"
    tagModalElements.createButton.innerText = mode == "edit" ? "Edit" : "Create"
    tagModalElements.deleteButton.hidden = mode != "edit"

    // reset form values
    tagModalElements.nameInput.value = ""
    tagModalElements.colorInput.value = rgbToHex("rgb(108, 67, 241)") // default color for new events/levels

    if (!tagModalElements.originalNameSection.hidden) {
        // create select element options
        tagModalElements.originalNameSelectElement.innerHTML = ""
        const tagData = type == "event" ?
            renderer.eventData : renderer.levelData

        for (const tagID of Object.keys(tagData)) {
            let optionElement = document.createElement("option")
            optionElement.value = tagID
            optionElement.innerText = tagData[tagID].displayName
            tagModalElements.originalNameSelectElement.appendChild(optionElement)
        }

        autoFillTagModalInputs()
    }
}

function autoFillTagModalInputs() {
    const tagData = addEditTagModal.dataset.type == "event" ?
        renderer.eventData : renderer.levelData
    
    tagModalElements.nameInput.value = tagData[tagModalElements.originalNameSelectElement.value].displayName
    tagModalElements.colorInput.value = rgbToHex(tagData[tagModalElements.originalNameSelectElement.value].backgroundColor)
}

function addEditTag() {
    const tagData = addEditTagModal.dataset.type == "event" ?
        renderer.eventData : renderer.levelData

    if (addEditTagModal.dataset.mode == "edit") {
        // EDIT TAG

        let tag = tagData[tagModalElements.originalNameSelectElement.value]
        let newDisplayName = tagModalElements.nameInput.value.trim()

        // ensure unique display name
        if (newDisplayName != tag.displayName && Object.values(tagData).find(x => x.displayName == newDisplayName)) {
            tagModalElements.alertText.innerText = `There is already an event with this name.`
            tagModalElements.alertText.hidden = false
            return false
        }

        tag.displayName = newDisplayName
        tag.backgroundColor = hexToRgb(tagModalElements.colorInput.value)
    } else {
        // ADD TAG

        let tag = {
            displayName: tagModalElements.nameInput.value.trim(),
            backgroundColor: hexToRgb(tagModalElements.colorInput.value)
        }

        let id = tag.displayName

        // ensure unique display name
        if (Object.values(tagData).find(x => x.displayName == tag.displayName)) {
            tagModalElements.alertText.innerText = `There is already an event with this name.`
            tagModalElements.alertText.hidden = false
            return false
        }

        // ensure unique ID
        while (tagData[id]) {
            id = crypto.randomUUID()
        }

        // add tag
        tagData[id] = tag
    }

    return true
}

addEventButton.addEventListener("click", () => openAddEditEventLevelModal("event", "add"))
editEventsButton.addEventListener("click", () => openAddEditEventLevelModal("event", "edit"))
addLevelButton.addEventListener("click", () => openAddEditEventLevelModal("level", "add"))
editLevelsButton.addEventListener("click", () => openAddEditEventLevelModal("level", "edit"))

tagModalElements.originalNameSelectElement.addEventListener("change", () => {
    tagModalElements.alertText.hidden = true
    autoFillTagModalInputs()
})

tagModalElements.cancelButton.addEventListener("click", () => addEditTagModal.hidden = true)
tagModalElements.createButton.addEventListener("click", () => {
    const mode = addEditTagModal.dataset.mode
    const type = addEditTagModal.dataset.type
    
    tagModalElements.alertText.hidden = true
    if (tagModalElements.nameInput.value.trim() == "") {
        tagModalElements.alertText.innerText = `Name cannot be empty.`
        tagModalElements.alertText.hidden = false
        return
    }

    // ADD/EDIT tag
    let success = addEditTag()

    if (!success)
        return
        
    addEditTagModal.hidden = true

    // save
    let saveSuccess = renderer.saveEventsAndLevels()

    if (!saveSuccess) {
        clearAlerts(addEditDrillAlerts)
        displayAlert(addEditDrillAlerts, `An unexpected error occured when trying to save the ${type}`, alertSeverities.danger)
        return
    }

    // refresh UI
    refreshEventAndLevelButtons()

    clearAlerts(addEditDrillAlerts)
    displayAlert(addEditDrillAlerts, `Succesfully ${mode == "edit" ? "edited" : "added"} ${type}.`, alertSeverities.info)
})

tagModalElements.deleteButton.addEventListener("click", async () => {
    // check if tag is being used in any drills
    let tagID = tagModalElements.originalNameSelectElement.value
    let type = addEditTagModal.dataset.type

    let numDrillsUsingTag = type == "event" ?
        renderer.drills.filter(drill => drill.events.includes(tagID)).length :
        renderer.drills.filter(drill => drill.levels.includes(tagID)).length

    if (numDrillsUsingTag > 0) {
        tagModalElements.alertText.innerText = `can't delete this ${type}\nbecause (${numDrillsUsingTag}) drills are using it.`
        tagModalElements.alertText.hidden = false
        return
    }

    // ask user to confirm action
    const response = await openConfirmModal(confirmModalContainer, `Are you sure you want to delete this ${type}?`)
    if (!response) {
        return
    }

    // delete tag
    if (type == "event") {
        delete renderer.eventData[tagID]
    } else {
        delete renderer.levelData[tagID]
    }

    // close modal
    addEditTagModal.hidden = true

    // save
    renderer.saveEventsAndLevels()

    // refresh UI
    refreshEventAndLevelButtons()

    clearAlerts(addEditDrillAlerts)
    displayAlert(addEditDrillAlerts, `Succesfully deleted ${type}.`, alertSeverities.info)
})

function refreshImageThumbnail() {
    if ((!formDrillImageFileName) || formDrillImageFileName.trim() == "") {
        imageElement.src = "../images/picture-filled.svg"
    } else {
        imageElement.src = `${renderer.drillImagesPath}/${formDrillImageFileName}`
    }
}

imageAddButton.addEventListener("click", async () => {
    let userSelectedImage = await renderer.getAndCopyUserSelectedImage()

    if (userSelectedImage)
        formDrillImageFileName = userSelectedImage

    // drillImageFileNameSpan.innerText = formDrillImageFileName ? formDrillImageFileName : ""
    refreshImageThumbnail()
})

imageRemoveButton.addEventListener("click", () => {
    formDrillImageFileName = null
    refreshImageThumbnail()
})

// imageContainer.addEventListener("hover")