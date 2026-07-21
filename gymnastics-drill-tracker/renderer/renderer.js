import { openConfirmModal, moveToFront, displayAlert, clearAlerts } from "./helpers.js"


let drills = []

let addEditMode = "add"
let editDrillOriginalName = ""

// event data
const eventData = {
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
const levelData = {
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

// html elements

// drill list page elements
const drillListElement = document.getElementById("drill_list")
const addEditSubmitButton = document.getElementById("add_edit_drill_submit")
const returnButton = document.getElementById("return_button")
const deleteDrillButton = document.getElementById("delete_drill_button")
const drillListView = document.getElementById("drill_list_view")

// add edit page elements
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

// alerts
const addEditDrillAlerts = document.getElementById("add_edit_drill_alert_container")
const alertSeverities = {
    info: "alert_info",
    danger: "alert_danger"
}

// drill list controls
const saveButton = document.getElementById("save_button")
const addDrillButton = document.getElementById("add_drill_button")

// modal elements
const confirmModalContainer = document.getElementById("confirm_modal_outer_container")
const confirmModalNoButton = document.getElementById("modal_no_button")
const confirmModalYesButton = document.getElementById("modal_yes_button")
const confirmModalHeader = document.getElementById("confirm_modal_header")


// window.ipcRenderer.send("requestGetDrills")

// window.ipcRenderer.on("getDrills", (drills) => {
//     console.log("recieved drills")
//     console.log(drills)
// })

async function getDrills() {
    drills = await window.ipcRenderer.invoke("getDrills")
    
    // move pinned drills to top
    moveToFront(drills, (d => d.pinned))

    refreshDrillListUI()
}

function getDrill(drillName) {
    return drills.find(d => d.name === drillName)
}

async function saveDrills() {
    await window.ipcRenderer.invoke("saveDrills", drills)
}

function constructDrillElement(drill) {
    let template = document.createElement("div")
    template.innerHTML = `
    <div class="drill">
        <div class="drill_header">
            <div>
                <h3 class="drill_name"></h3>
                <div class="event_tags">

                </div>
            </div>
            <div>
                <button class="expand_button">Expand</button>
                <div class="pin_button">
                    <img class="pin_hollow_image" src="../images/pin-hollow.svg" alt="Pin">
                    <img class="pin_filled_image" src="../images/pin-filled.svg" alt="Pinned" hidden>
                </div>
            </div>
        </div>
        <div class="drill_body" hidden>
            <div>
                <p class="drill_description"></p>
                <p class="level_tags_label">Recommended Levels:</p>
                <div class="level_tags">

                </div>
            </div>
            <div>
                <button class="edit_button">Edit</button>
            </div>
        </div>
    </div>
    `
    let element = template.firstElementChild

    // set element content
    element.dataset.id = drill.name;
    element.querySelector(".drill_name").textContent = drill.name;
    element.querySelector(".drill_description").textContent = drill.description;

    element.querySelector(".pin_hollow_image").hidden = drill.pinned
    element.querySelector(".pin_filled_image").hidden = !drill.pinned

    // add event tags
    if (drill.events) {
        let eventTags = element.querySelector(".event_tags")
        drill.events.forEach(event => {
            let tag = document.createElement("button")
            tag.classList.add("event_tag")
            tag.innerText = event
            eventTags.appendChild(tag)
            if (eventData[event])
                tag.style.backgroundColor = eventData[event].backgroundColor
        })
    }

    // add level tags
    if (drill.levels) {
        let levelTags = element.querySelector(".level_tags")
        drill.levels.forEach(level => {
            let tag = document.createElement("button")
            tag.classList.add("level_tag")
            tag.innerText = level
            if (levelData[level])
                tag.style.backgroundColor = levelData[level].backgroundColor
            levelTags.appendChild(tag)
        })
    }
    
    // element.querySelector(".expand-button").addEventListener("click", () => expandDrill(element))
    // element.querySelector(".pin-button").addEventListener("click", () => pinDrill(element))
    // element.querySelector(".edit-button").addEventListener("click", () => openDrillForm(drill.name))

    return element
}

function refreshDrillListUI() {
    drillListElement.innerHTML = ""
    drills.forEach(drill => {
        drillListElement.appendChild(constructDrillElement(drill))
    })
}

// function getDrillDomElement(drillName) {
//     let matching = Array.from(drillListElement.querySelectorAll(".drill")).filter(e => e.dataset.id == drillName)
//     if (matching.length == 0)
//         return
//     return matching[0]
// }

function expandCollapseDrill(drillElement) {
    const drillBody = drillElement.querySelector(".drill_body")
    if (drillBody == null) {
        console.log("couldn't find drill body element")
        return
    }
    if (drillBody.hidden) {
        // expand
        drillBody.hidden = false

        drillElement.querySelector(".expand_button").innerHTML = "Collapse"
    } else {
        // collapse
        drillBody.hidden = true

        drillElement.querySelector(".expand_button").innerHTML = "Expand"
    }
}

function pinDrill(drillElement) {
    const drill = getDrill(drillElement.dataset.id)
    if (!drill.pinned) {
        // pin drill
        drill.pinned = true
    } else {
        // unpin drill
        drill.pinned = false
    }

    // move pinned drills to top
    moveToFront(drills, (d => d.pinned))

    refreshDrillListUI()
}

function openDrillList() {
    drillListView.hidden = false
    addEditDrillView.hidden = true

    // refresh list
    getDrills()
}

function openDrillForm(drillName = null) {
    // save drills
    saveDrills()

    // clear alerts
    addEditDrillAlerts.innerHTML = ""

    // clear form values
    addEditDrillForm.name.value = ""
    addEditDrillForm.description.value = ""

    let drill = drillName != null ? getDrill(drillName) : null
    editDrillOriginalName = drillName

    // instantiate event buttons
    formEventButtonsElement.innerHTML = ""
    formEventButtonsData = []
    for (const event of Object.keys(eventData)) {
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
    for (const level of Object.keys(levelData)) {
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
                if (eventData[buttonData.eventName])
                    buttonData.element.style.backgroundColor = eventData[buttonData.eventName].backgroundColor
            }
        })

        // set level buttons to active for levels included in this drill
        formLevelButtonsData.forEach(buttonData => {
            if (drill.levels ? drill.levels.includes(buttonData.levelName) : false) {
                buttonData.selected = true
                // update button UI
                buttonData.element.classList.add("level_button_selected")
                if (levelData[buttonData.levelName])
                    buttonData.element.style.backgroundColor = levelData[buttonData.levelName].backgroundColor
            }
        })
    }

    drillListView.hidden = true
    addEditDrillView.hidden = false
}

// event listeners

// drill buttons
drillListElement.addEventListener("click", (event) => {
    // console.log(event.target)

    const drillElement = event.target.closest(".drill")
    if (!drillElement)
        return

    // determine button
    if (event.target.classList.contains("expand_button")) {
        expandCollapseDrill(drillElement)
    } else if (event.target.classList.contains("pin_button") || event.target.parentElement.classList.contains("pin_button")) {
        pinDrill(drillElement)
    } else if (event.target.classList.contains("edit_button")) {
        openDrillForm(drillElement.dataset.id)
    }
})

addDrillButton.addEventListener("click", () => {
    openDrillForm()
})

saveButton.addEventListener("click", () => {
    saveDrills()
})

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
        let indexOfDrill = drills.findIndex(d => d.name === editDrillOriginalName)
        if (indexOfDrill < 0) {
            displayAlert(addEditDrillAlerts, "This drill couldn't be found. Please return to the drill list and try again.", alertSeverities.danger)
            return
        }

        // if name has been changed, make sure the new name is not in use
        if (editDrillOriginalName !== drill.name && drills.find(d => d.name === drill.name)) {
            displayAlert(addEditDrillAlerts, "There is already a drill with this name. Please choose another name", alertSeverities.danger)
            return
        }

        // edit drill
        drills[indexOfDrill] = drill
    } else { // add mode
        // ensure that drill doesn't exist
        if (getDrill(drill.name)) {
            displayAlert(addEditDrillAlerts, "There is already a drill with this name. Please choose another name", alertSeverities.danger)
            return
        }

        // add drill
        drills.unshift(drill)
    }

    await saveDrills() // TODO: stay on page and display error message if saving fails
    console.log("succesfully saved added or edited drill")

    // return to main list
    openDrillList()
})

returnButton.addEventListener("click", (event) => {
    openDrillList()
})

deleteDrillButton.addEventListener("click", async (event) => {
    // open delete modal
    const responce = await openConfirmModal(confirmModalContainer, `Are you sure you want to delete the drill\n"${editDrillOriginalName}"?`)
    if (responce) {
        // TODO: create backup of drills.json

        // delete the drill
        drills = drills.filter(d => d.name !== editDrillOriginalName)
        
        // save
        await saveDrills()

        // return to drill list
        openDrillList()
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
                buttonData.element.style.backgroundColor = eventData[buttonData.eventName].backgroundColor
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
                buttonData.element.style.backgroundColor = levelData[buttonData.levelName].backgroundColor
            } else {
                buttonData.element.classList.remove("level_button_selected")
                buttonData.element.style.removeProperty("background-color");
            }
                

        }
    }
})

// open drills list
openDrillList()