const fs = require('node:fs/promises');
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Drill = require('./models/drill.js')

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

async function loadDrills() {
    try {
        const filePath = path.join(__dirname, 'data', 'drills.json');

        const data = await fs.readFile(filePath, 'utf8');
        const drillData = JSON.parse(data);

        return drillData
    } catch (error) {
        console.error('Failed to load drills:', error);
        return []
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

ipcMain.handle("getDrills", async () => {
    return await loadDrills()
})

ipcMain.handle("saveDrills", async (event, drills) => {
    await saveDrills(drills)
    return
})