const fs = require('node:fs/promises');
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const Drill = require('./models/drill.js');
const { describe } = require('node:test');

const isDev = process.env.NODE_ENV !== "production"
const isMac = process.platform === 'darwin'

let mainWindow
let savedBeforeExit = false

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

    mainWindow.on("close", (event) => {
        if (!savedBeforeExit) {
            // prevent window from closing immediately
            event.preventDefault()

            // auto save
            mainWindow.webContents.send('saveAndClose');
        }
    })
})

// win.on("window-all-closed", async (event) => {


ipcMain.on("quitApp", () => {
    console.log("quitting app")
    savedBeforeExit = true
    if (!isMac)
        app.quit()
})

async function loadDrills() {
    try {
        const filePath = path.join(__dirname, 'data', 'drills.json');

        const data = await fs.readFile(filePath, 'utf8');
        let drillData = JSON.parse(data)

        // map json output to valid drills (this is partially to update older drills. Ex: if an older drill doesn't have a levels property, this will create it)
        // drillData = drillData.map(x => {
        //     return {
        //         name: x.name,
        //         description: x.description,
        //         events: x.events ? x.events : [],
        //         levels: x.levels ? x.levels : [],
        //         pinned: x.pinned ? x.pinned : false,
        //         image: x.image
        //     }
        // })

        drillData.forEach(drill => {
            drill.events = drill.events ? drill.events : []
            drill.levels = drill.levels ? drill.levels : []
            drill.pinned = drill.pinned ? drill.pinned : false
        });

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
        
        return levelData
    } catch (error) {
        console.error('Failed to load levels:', error);
        return null
    }
}

async function saveDrills(drills) {
    try {
        // Make sure the destination directory exists
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        
        const filePath = path.join(__dirname, 'data', 'drills.json');
        const data = JSON.stringify(drills, null, 2);

        await fs.writeFile(filePath, data, 'utf8');

        console.log(`Saved ${drills.length} drills.`);
        return true
    } catch (error) {
        console.error('Failed to save drills:', error);
        return false
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
        // Make sure the destination directory exists
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });

        const filePath = path.join(__dirname, 'data', 'events.json');
        const data = JSON.stringify(events, null, 2);

        await fs.writeFile(filePath, data, 'utf8');

        console.log(`Saved ${events.length} events.`);
        return true
    } catch (error) {
        console.error('Failed to save events:', error);
        return false
    }
}

async function saveLevels(levels) {
    try {
        // Make sure the destination directory exists
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });

        const filePath = path.join(__dirname, 'data', 'levels.json');
        const data = JSON.stringify(levels, null, 2);

        await fs.writeFile(filePath, data, 'utf8');

        console.log(`Saved ${levels.length} levels.`);
        return true
    } catch (error) {
        console.error('Failed to save levels:', error);
        return false
    }
}

async function copyAndRenameFile(sourcePath, destinationDir, newFileName) {
  // Make sure the destination directory exists
  await fs.mkdir(destinationDir, { recursive: true });

  const destinationPath = path.join(destinationDir, newFileName);

  await fs.copyFile(sourcePath, destinationPath);

  return destinationPath;
}

async function getFileExists(pathElements) {
    const fullPath = path.join(__dirname, ...pathElements)

    try {
        await fs.access(fullPath);
        return true;
    } catch {
        return false;
    }
}

async function getAndCopyUserSelectedImage() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: "Select Drill Image",
        properties: ["openFile"],
        filters: [
            {
                name: "Images",
                extensions: [
                    "png",
                    "jpg",
                    "jpeg",
                    "webp",
                    "bmp",
                    "svg"
                ]
            }
        ]
    });

    if (canceled || filePaths.length === 0) {
        return null;
    }

    const sourcePath = filePaths[0];

    const destinationDirectory = path.join(
        __dirname,
        "data",
        "drill-images"
    );

    await fs.mkdir(destinationDirectory, { recursive: true });

    const parsed = path.parse(sourcePath);

    let fileName = parsed.base;
    let destinationPath = path.join(destinationDirectory, fileName);

    // ensure name is unqiue
    let counter = 1
    while (await getFileExists(["data", "drill-images", fileName])) {
        fileName = `${parsed.name} (${counter})${parsed.ext}`;
        destinationPath = path.join(destinationDirectory, fileName);
        counter++;
    }

    await fs.copyFile(sourcePath, destinationPath);

    return fileName;
}

async function getFileNames(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    return entries
        .filter(entry => entry.isFile())
        .map(entry => entry.name);
}

async function deleteUnusedImages(fileNames) {
    const directory = path.join(__dirname, "data", "drill-images");

    let deletedFileNames = []
    for (const fileName of fileNames) {
        const filePath = path.join(directory, fileName);

        try {
            const stats = await fs.stat(filePath);

            // Only delete regular files, never directories.
            if (stats.isFile()) {
                await fs.unlink(filePath);
                deletedFileNames.push(fileName)
            }
        } catch {
            console.log(`failed to delete image: ${fileName}`)    
        }
    }

    return deletedFileNames
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
    return await saveDrills(drills)
})

ipcMain.handle("saveEvents", async (event, events) => {
    return await saveEvents(events)
})

ipcMain.handle("saveLevels", async (event, levels) => {
    return await saveLevels(levels)
})

ipcMain.handle("backupFiles", async () => {
    const dataFolderPath = path.join(__dirname, 'data');
    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

    console.log(`backing up files to folder: "${timestamp}"`)

    await copyAndRenameFile(
        path.join(dataFolderPath, 'drills.json'),
        path.join(dataFolderPath, "backups", timestamp),
        "drills-backup.json"
    )

    await copyAndRenameFile(
        path.join(dataFolderPath, 'events.json'),
        path.join(dataFolderPath, "backups", timestamp),
        "events-backup.json"
    )

    await copyAndRenameFile(
        path.join(dataFolderPath, 'levels.json'),
        path.join(dataFolderPath, "backups", timestamp),
        "levels-backup.json"
    )

    console.log("backed up files")
})

ipcMain.handle("getFileExists", async (event, pathElements) => {
    return await getFileExists(pathElements)
})

ipcMain.handle("getPath", (event, pathElements) => {
    return path.join(__dirname, ...pathElements)
})

ipcMain.handle("getAndCopyUserSelectedImage", async () => {
    return await getAndCopyUserSelectedImage()
})

ipcMain.handle("getFileNames", async (event, directory) => {
    return await getFileNames(directory)
})

ipcMain.handle("deleteUnusedImages", async (event, fileNames) => {
    return await deleteUnusedImages(fileNames)
})