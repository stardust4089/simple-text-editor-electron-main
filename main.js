const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDevEnv = process.env.NODE_ENV === 'development';

if (isDevEnv) {
  try {
    require('electron-reloader')(module);
  } catch {}
}

let mainWindow;
let openedFilePath;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'renderer.js')
    }
  });

  if (isDevEnv) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile('index.html');

  const menuTemplate = [
    {
      label: "File",
      submenu: [
        {
          label: "Add New File",
          click: () => ipcMain.emit("open-document-triggered"),
        },
        {
          label: "Create New File",
          click: () => ipcMain.emit("create-document-triggered"),
        },
        { type: "separator" },
        {
          label: "Open Recent",
          role: "recentdocuments",
          submenu: [
            {
              label: "Clear Recent",
              role: "clearrecentdocuments",
            },
          ],
        },
        {
          role: "quit",
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteAndMatchStyle" },
        { role: "delete" },
        { role: "selectAll" },
        { type: "separator" },
        {
          label: "Speech",
          submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(createWindow);



// IPC handlers for your renderer process events
ipcMain.on('save-delta', (event, quill) => {
  saveDeltaToFile(quill);
});

ipcMain.on('load-delta', (event, quill) => {
  loadDeltaFromFile(quill);
});

