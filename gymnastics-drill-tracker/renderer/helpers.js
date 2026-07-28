export function getMovedToFront(array, predicate) {
    return array.toSorted((a, b) => {
        const aMatch = predicate(a);
        const bMatch = predicate(b);

        if (aMatch === bMatch) return 0;
        return aMatch ? -1 : 1;
    });
}

export function createElementFromTemplate(stringTemplate) {
    const template = document.createElement("div")
    template.innerHTML = stringTemplate
    return template.firstElementChild
}

export async function openConfirmModal(container, message = "Are you sure?") {
    container.innerHTML = `
        <div class="modal_background">
            <div class="modal">
                <h3 class="modal_header">Are you sure?</h3>
                <div class="modal_buttons">
                    <button class="modal_no_button">No</button>
                    <button class="modal_yes_button">Yes</button>
                </div>
            </div>
        </div>
    `
    
    container.querySelector(".modal_header").innerText = message
    container.hidden = false
    
    return new Promise((resolve) => {
        container.querySelector(".modal_yes_button").onclick = () => {
            container.hidden = true;
            container.innerHTML = ""
            resolve(true)
        }

        container.querySelector(".modal_no_button").onclick = () => {
            container.hidden = true;
            container.innerHTML = ""
            resolve(false)
        }
    })
}

export function displayAlert(container, message, alert_severity = "alert_info") {
    let element = createElementFromTemplate(`
        <div class="alert">
            <p class="alert_text">This is an alert</p>
            <img class="alert_close_icon" src="../images/close-ellipse.svg" alt="close">
        </div>
    `)

    element.classList.add(alert_severity)
    element.querySelector(".alert_text").innerText = message
    element.querySelector(".alert_close_icon").onclick = () => element.remove()
    
    container.appendChild(element)
}

export function clearAlerts(alertContainer) {
    alertContainer.innerHTML = ""
}

export function animateReposition(parent, reorderFn) {
    const children = [...parent.children];

    // get positions before reorder
    const first = new Map(
        children.map(child => [child, child.getBoundingClientRect()])
    );

    // Perform the DOM changes.
    reorderFn();

    // get positions after reorder
    const last = new Map(
        children.map(child => [child, child.getBoundingClientRect()])
    );

    // instantly each element back to where it was using css transform (not changing DOM order)
    children.forEach(child => {
        const distanceY = first.get(child).top - last.get(child).top;

        if (distanceY === 0) return;

        child.style.transition = "none";
        child.style.transform = `translateY(${distanceY}px)`;
    });

    // animate elements back into place
    requestAnimationFrame(() => { // wait until next frame to not override previous action
        children.forEach(child => {
            child.style.transition = "transform 500ms ease";
            child.style.transform = "";
        });
    });

    // (cleanup) remove transition
    children.forEach(child => {
        child.addEventListener("transitionend", () => {
            child.style.transition = "";
            child.style.transform = ""
        }, { once: true });
    })
}

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function rgbToHex(rgb) {
    const [r, g, b] = rgb.match(/\d+/g).map(Number);

    return (
        "#" +
        [r, g, b]
            .map(n => n.toString(16).padStart(2, "0"))
            .join("")
    );
}

export function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgb(${r}, ${g}, ${b})`;
}