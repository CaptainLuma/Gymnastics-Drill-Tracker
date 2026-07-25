const fs = require('node:fs/promises');
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Drill = require('./models/drill.js');
const { describe } = require('node:test');

const isDev = process.env.NODE_ENV !== "production"
const isMac = process.platform === 'darwin'

let mainWindow
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Drill Tracker',
        fullscreen: true,
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    // open devtools if in dev environment
    if (isDev) {
        mainWindow.webContents.openDevTools()
    }

    mainWindow.maximize()
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'))
}

app.whenReady().then(() => {
    createMainWindow()

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length == 0)
            createMainWindow()
    })
})

app.on("window-all-closed", () => {
    if (!isMac)
        app.quit()
})



function getDataFilePath() {
    return path.join(__dirname, 'data');
}

async function loadDrills() {
    try {
        const filePath = path.join(__dirname, 'data', 'drills.json');

        const data = await fs.readFile(filePath, 'utf8');
        let drillData = JSON.parse(data)

        // map json output to valid drills (this is partially to update older drills. Ex: if an older drill doesn't have a levels property, this will create it)
        drillData = drillData.map(x => {
            return {
                name: x.name,
                description: x.description,
                events: x.events ? x.events : [],
                levels: x.levels ? x.levels : [],
                pinned: x.pinned ? x.pinned : false,
            }
        })

        return drillData
    } catch (error) {
        console.error('Failed to load drills:', error);
        return null
    }
}

async function loadEvents() {
    try {
        const filePath = path.join(__dirname, 'data', 'events.json');

        const data = await fs.readFile(filePath, 'utf8');
        let eventData = JSON.parse(data)

        // convert to dictionary
        // let eventDict = {}
        // eventData.forEach(x => {
        //     eventDict[x.name] = {
        //         backgroundColor: x.backgroundColor
        //     }
        // });

        return eventData
    } catch (error) {
        console.error('Failed to load events:', error);
        return null
    }
}

async function loadLevels() {
    try {
        const filePath = path.join(__dirname, 'data', 'levels.json');

        const data = await fs.readFile(filePath, 'utf8');
        let levelData = JSON.parse(data)
        
        // convert to dictionary
        // let levelDict = {}
        // eventData.forEach(x => {
        //     levelDict[x.name] = {
        //         backgroundColor: x.backgroundColor
        //     }
        // });

        return levelData
    } catch (error) {
        console.error('Failed to load levels:', error);
        return null
    }
}

async function saveDrills(drills) {
    try {
        const filePath = path.join(__dirname, 'data', 'drills.json');
        const data = JSON.stringify(drills, null, 2);

        await fs.writeFile(filePath, data, 'utf8');

        console.log(`Saved ${drills.length} drills.`);
    } catch (error) {
        console.error('Failed to save drills:', error);
    }
}

async function saveEvents(events) {
    // convert events to list
    // let events = []
    // for (let [key, value] of Object.entries(eventsDict)) {
    //     events.push({
    //         name: key,
    //         backgroundColor: value.backgroundColor
    //     })
    // }

    try {
        const filePath = path.join(__dirname, 'data', 'events.json');
        const data = JSON.stringify(events, null, 2);

        await fs.writeFile(filePath, data, 'utf8');

        console.log(`Saved ${events.length} events.`);
    } catch (error) {
        console.error('Failed to save events:', error);
    }
}

async function saveLevels(levels) {
    // convert levels to list
    // let levels = []
    // for (let [key, value] of Object.entries(levelsDict)) {
    //     levels.push({
    //         name: key,
    //         backgroundColor: value.backgroundColor
    //     })
    // }

    try {
        const filePath = path.join(__dirname, 'data', 'levels.json');
        const data = JSON.stringify(levels, null, 2);

        await fs.writeFile(filePath, data, 'utf8');

        console.log(`Saved ${levels.length} levels.`);
    } catch (error) {
        console.error('Failed to save levels:', error);
    }
}

ipcMain.handle("getDrills", async () => {
    return await loadDrills()
})

ipcMain.handle("getEvents", async () => {
    return await loadEvents()
})

ipcMain.handle("getLevels", async () => {
    return await loadLevels()
})

ipcMain.handle("saveDrills", async (event, drills) => {
    await saveDrills(drills)
    return
})

ipcMain.handle("saveEvents", async (event, events) => {
    await saveEvents(events)
    return
})

ipcMain.handle("saveLevels", async (event, levels) => {
    await saveLevels(levels)
    return
})

ipcMain.handle("getDataFilePath", () => {
    return getDataFilePath()
})