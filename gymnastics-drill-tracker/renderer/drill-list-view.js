import { 
    openConfirmModal, 
    displayAlert, 
    clearAlerts, 
    getMovedToFront, 
    animateReposition,
    shuffle } from "./helpers.js"
import * as renderer from "./renderer.js"

// drill list page elements
const drillListView = document.getElementById("drill_list_view")
const addEditDrillView = document.getElementById("add_edit_drill_view")

const drillListElement = document.getElementById("drill_list")

// drill list controls
const backupButton = document.getElementById("backup_button")
const addDrillButton = document.getElementById("add_drill_button")

// filter controls
const textSearchInput = document.getElementById("name_search_input")
const textSearchType = document.getElementById("text_search_type")
const eventFiltersContainer = document.getElementById("event_filter_buttons")
const levelFiltersContainer = document.getElementById("level_filter_buttons")
let eventFiltersData = []
let levelFiltersData = []

const resultLimitInput = document.getElementById("result_limit")

// sort controls
const randomizeOrderButton = document.getElementById("randomize_order_button")

// alerts
const drillListAlerts = document.getElementById("drill_list_alert_container")
const alertSeverities = {
    info: "alert_info",
    danger: "alert_danger"
}

/**
 * actions to be performed only once (when the app starts)
 */
export function onAppStart() {
    
}

function refreshFilterButtons() {
    // event buttons
    eventFiltersContainer.innerHTML = ""
    eventFiltersData = []
    for (const eventID of Object.keys(renderer.eventData)) {
        let element = document.createElement("button")
        element.classList.add("event_button")
        element.innerText = renderer.eventData[eventID].displayName
        eventFiltersContainer.appendChild(element)
        eventFiltersData.push({
            element: element,
            eventName: eventID,
            selected: false
        })
    }

    // level buttons
    levelFiltersContainer.innerHTML = ""
    levelFiltersData = []
    for (const levelID of Object.keys(renderer.levelData)) {
        let element = document.createElement("button")
        element.classList.add("level_button")
        element.innerText = renderer.levelData[levelID].displayName
        levelFiltersContainer.appendChild(element)
        levelFiltersData.push({
            element: element,
            levelName: levelID,
            selected: false
        })
    }
}

export async function openDrillList(reloadDrillData = true) {
    drillListView.hidden = false
    addEditDrillView.hidden = true

    refreshFilterButtons()

    // refresh list
    if (reloadDrillData) {
        let success = await renderer.getDrills()
        if (!success) {
            let filePath = await renderer.getPath(["data"])
            clearAlerts(drillListAlerts)
            displayAlert(drillListAlerts, `An unexpected error occured when loading drills. Please check the file path:\n${filePath}`, alertSeverities.danger)
        }
    }

    refreshListUI()
}

function constructDrillElement(drill) {
    let template = document.createElement("div")
    template.innerHTML = `
    <div class="drill">
        <div class="drill_header">
            <div>
                <!-- <button class="expand_button">Expand</button> -->
                <div class="expand_button">
                    <img class="expand_image" src="../images/dropdown.svg" alt="Expand">
                </div>
                <h3 class="drill_name"></h3>
                <div class="event_tags">

                </div>
            </div>
            <div>
                <button class="edit_button">Edit</button>
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
        </div>
    </div>
    `
    let element = template.firstElementChild

    // set element content
    element.dataset.id = drill.name
    element.dataset.pinned = drill.pinned
    element.dataset.expanded = "false"
    element.querySelector(".drill_name").textContent = drill.name
    element.querySelector(".drill_description").textContent = drill.description
    element.querySelector(".pin_hollow_image").hidden = drill.pinned
    element.querySelector(".pin_filled_image").hidden = !drill.pinned
    
    if (drill.pinned) {
        element.classList.add("pinned_drill")
    } else {
        element.classList.remove("pinned_drill")
    }
    
    // add event tags
    if (drill.events) {
        let eventTags = element.querySelector(".event_tags")
        drill.events.forEach(eventID => {
            if (!renderer.eventData[eventID]) {
                console.log(`drill contains event which is not recognized: "${eventID}"`)
                return
            }

            let tag = document.createElement("button")
            tag.classList.add("event_tag")
            tag.innerText = renderer.eventData[eventID].displayName
            tag.style.backgroundColor = renderer.eventData[eventID].backgroundColor
            eventTags.appendChild(tag)
        })
    }

    // add level tags
    if (drill.levels) {
        let levelTags = element.querySelector(".level_tags")
        drill.levels.forEach(levelID => {
            if (!renderer.levelData[levelID]) {
                console.log(`drill contains level which is not recognized: "${levelID}"`)
                return
            }

            let tag = document.createElement("button")
            tag.classList.add("level_tag")
            tag.innerText = renderer.levelData[levelID].displayName
            tag.style.backgroundColor = renderer.levelData[levelID].backgroundColor
            levelTags.appendChild(tag)
        })
    }

    // image
    if (drill.image) {
        const imgElement = document.createElement("img")
        imgElement.src = `${renderer.drillImagesPath}/${drill.image}`
        imgElement.classList.add("drill_image")

        const imageContainer = document.createElement("div")
        imageContainer.classList.add("drill_image_container")
        
        imageContainer.appendChild(imgElement)
        element.querySelector(".drill_body").appendChild(imageContainer)
    }



    return element
}

function refreshListUI(randomSort = false) {
    let drillsToDisplay = renderer.drills.slice() // copy array to not effect order of original array

    // perform filtering

    // filter by name & description input
    let terms = textSearchInput.value.trim().toLowerCase().split(" ")
    drillsToDisplay = drillsToDisplay.filter(drill => {
        if (drill.pinned)
            return true

        let textToSearch

        if (textSearchType.value == "name") {
            textToSearch = drill.name
        } else if (textSearchType.value == "description") {
            textToSearch = drill.description
        } else {
            textToSearch = drill.name + " " + drill.description
        }

        // return if name or description includes at least one of the terms
        return terms.some(term => textToSearch.toLowerCase().includes(term)); 
    })

    let selectedEvents = eventFiltersData.filter(x => x.selected).map(x => x.eventName)
    selectedEvents.forEach(event => {
        drillsToDisplay = drillsToDisplay.filter(d => d.pinned || (d.events ? d.events.includes(event) : false))
    })

    let selectedLevels = levelFiltersData.filter(x => x.selected).map(x => x.levelName)
    selectedLevels.forEach(level => {
        drillsToDisplay = drillsToDisplay.filter(d => d.pinned || (d.levels ? d.levels.includes(level) : false))
    })

    // sort
    if (randomSort) {
        shuffle(drillsToDisplay)
    }

    // move pinned to front
    drillsToDisplay = getMovedToFront(drillsToDisplay, d => d.pinned)

    // add elements to DOM (TODO, don't delete and recreate elements that are already in the DOM)
    drillListElement.innerHTML = ""
    drillsToDisplay.forEach(drill => {
        drillListElement.appendChild(constructDrillElement(drill))
    })

    limitResults()
}

function limitResults() {
    if (
        resultLimitInput.value == "" || 
        resultLimitInput.valueAsNumber == NaN ||
        resultLimitInput.valueAsNumber < 1
    ) {
        // show all
        Array.from(drillListElement.children).forEach(child => child.hidden = false)
        return
    }
    
    Array.from(drillListElement.children).forEach(child => child.hidden = true)
    
    let numPinned = 0
    for (let i = 0; i < drillListElement.children.length; i++) {
        if (drillListElement.children[i].dataset.pinned != "true") {
            break
        }
        numPinned++
    }

    let numberElementsToShow = numPinned + resultLimitInput.valueAsNumber

    for (let i = 0; i < numberElementsToShow; i++) {
        if (i >= drillListElement.children.length)
            break
        drillListElement.children[i].hidden = false
    }
}

// function getDrillDomElement(drillName) {
//     let matching = Array.from(drillListElement.querySelectorAll(".drill")).filter(e => e.dataset.id == drillName)
//     if (matching.length == 0)
//         return
//     return matching[0]
// }

function expandCollapseDrill(drillElement) {
    const drillBody = drillElement.querySelector(".drill_body")

    drillElement.dataset.expanded = (drillElement.dataset.expanded == "true" ? "false" : "true") // toggle
    let expanded = (drillElement.dataset.expanded == "true")
    
    // drillElement.querySelector(".expand_button").innerHTML = expanded ? "Collapse" : "Expand"

    // animate open/close
    animateReposition(drillListElement, () => {
        drillBody.hidden = !expanded
    })

    // keep expanded/collapsed drill behind
    drillElement.style.position = "relative"
    drillElement.style.zIndex = "0"
    drillElement.addEventListener("transitionend", () => {
        drillElement.style.removeProperty("z-index");
    }, { once: true });
}   

function pinDrill(drillElement) {
    const drill = renderer.drills.find(d => d.name === drillElement.dataset.id)
    if (!drill)
        throw new Error(`Couldn't find drill for drill DOM element with name: ${drillElement.dataset.id}`)

    drill.pinned = !drill.pinned
    drillElement.dataset.pinned = drill.pinned
    drillElement.querySelector(".pin_hollow_image").hidden = drill.pinned
    drillElement.querySelector(".pin_filled_image").hidden = !drill.pinned

    if (drill.pinned) {
        drillElement.classList.add("pinned_drill")
    } else {
        drillElement.classList.remove("pinned_drill")
    }

    if (drill.pinned) {
        // move to top
        animateReposition(drillListElement, () => {
            drillListElement.insertBefore(drillElement, drillListElement.firstChild);
        });
    } else {
        // unpin (move below lowest pinned element)
        const lowestPinned = Array.from(drillListElement.children).findLast(el => el.dataset.pinned == "true")
        animateReposition(drillListElement, () => {
            drillListElement.insertBefore(drillElement, lowestPinned ? lowestPinned.nextElementSibling : drillListElement.firstChild)
        });
    }

    // keep pinned/unpinned drill on top during animation
    drillElement.style.position = "relative"
    drillElement.style.zIndex = "1000"
    drillElement.addEventListener("transitionend", () => {
        drillElement.style.removeProperty("z-index");
    }, { once: true });

    limitResults()
}


// event listeners
drillListElement.addEventListener("click", (event) => {
    const drillElement = event.target.closest(".drill")
    if (!drillElement)
        return

    // determine button
    if (event.target.classList.contains("expand_button") || event.target.classList.contains("expand_image")) {
        expandCollapseDrill(drillElement)
    } else if (event.target.classList.contains("pin_button") || event.target.parentElement.classList.contains("pin_button")) {
        pinDrill(drillElement)
    } else if (event.target.classList.contains("edit_button")) {
        renderer.openDrillFormView(drillElement.dataset.id)
    }
})

addDrillButton.addEventListener("click", () => {
    renderer.openDrillFormView()
})

textSearchInput.addEventListener("change", () => refreshListUI())

eventFiltersContainer.addEventListener("click", (e) => {
    if (!e.target.classList.contains("event_button")) return

    const buttonData = eventFiltersData.find(x => x.element == e.target)
    if (!buttonData)
        throw new Error("no button data found for target: ", e.target)

    // toggle
    buttonData.selected = !buttonData.selected

    // update button UI (background color)
    if (buttonData.selected) {
        buttonData.element.classList.add("event_button_selected")
        buttonData.element.style.backgroundColor = renderer.eventData[buttonData.eventName].backgroundColor
    } else {
        buttonData.element.classList.remove("event_button_selected")
        buttonData.element.style.removeProperty("background-color");
    }

    // apply filter
    refreshListUI()
})

levelFiltersContainer.addEventListener("click", (e) => {
    if (!e.target.classList.contains("level_button")) return

    const buttonData = levelFiltersData.find(x => x.element == e.target)
    if (!buttonData)
        throw new Error("no button data found for target: ", e.target)

    // toggle
    buttonData.selected = !buttonData.selected

    // update button UI (background color)
    if (buttonData.selected) {
        buttonData.element.classList.add("level_button_selected")
        buttonData.element.style.backgroundColor = renderer.levelData[buttonData.levelName].backgroundColor
    } else {
        buttonData.element.classList.remove("level_button_selected")
        buttonData.element.style.removeProperty("background-color");
    }

    // apply filter
    refreshListUI()
})

randomizeOrderButton.addEventListener("click", () => {
    refreshListUI(true)
})

backupButton.addEventListener("click", async () => {
    try {
        await renderer.backupFiles()
        clearAlerts(drillListAlerts)
        displayAlert(drillListAlerts, "successfully backed up files.", alertSeverities.info)
    } catch {
        clearAlerts(drillListAlerts)
        displayAlert(drillListAlerts, "an unexpected error occured when trying to backup files", alertSeverities.danger)
    }
})

resultLimitInput.addEventListener("change", () => {
    if (resultLimitInput.valueAsNumber == 0) {
        resultLimitInput.value = ""
    }

    limitResults()
})
textSearchType.addEventListener("change", () => refreshListUI())