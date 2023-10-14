const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDevEnv = process.env.NODE_ENV === 'development';
if (isDevEnv) {
  try {
    require('electron-reloader')(module);
  } catch { }
}

let mainWindow;
let openedFilePath;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    icon: __dirname + '/images/iconpng.icns',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      spellcheck: true, // Enable spellcheck
      preload: path.join(app.getAppPath(), 'renderer.js')
    }
  });


  if (isDevEnv) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.webContents.openDevTools();
    // // Attach context menu to the webContents

    // // Set up the SpellCheckHandler
    // SpellCheckHandler.attachTo(webContents);
  mainWindow.loadFile('index.html');
  const { Menu, MenuItem } = require('electron')

  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = new Menu()
  
    // Add each spelling suggestion
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(new MenuItem({
        label: suggestion,
        click: () => mainWindow.webContents.replaceMisspelling(suggestion)
      }))
    }
  
    // Allow users to add the misspelled word to the dictionary
    if (params.misspelledWord) {
      menu.append(
        new MenuItem({
          label: 'Add to dictionary',
          click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
        })
      )
    }
  
    menu.popup()
  })
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
ipcMain.on('text-change', function(delta, oldDelta, source) {
  console.log("text-change");
  if (source == 'api') {
    console.log("An API call triggered this change.");
  } else if (source == 'user') {
    console.log("A user action triggered this change.");
  }
});


const openFile = (filePath) => {
  fs.readFile(filePath, "utf8", (error, content) => {
    if (error) {
      handleError();
    } else {
      app.addRecentDocument(filePath);
      openedFilePath = filePath;
      mainWindow.webContents.send("document-opened", { filePath, content });
    }
  });
};

ipcMain.on("open-document-triggered", () => {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "text files", extensions: ["txt"] }],
    })
    .then(({ filePaths }) => {
      const filePath = filePaths[0];

      openFile(filePath);
    });
});

app.on('before-quit', () => {
  mainWindow.webContents.send('save');
});

ipcMain.on("save-document", (_, textareaContent) => {
  fs.writeFile(openedFilePath, textareaContent, (error) => {
    if (error) {
      handleError();
    }
  });
});


ipcMain.on("create-document-triggered", () => {
  dialog
    .showSaveDialog(mainWindow, {
      filters: [{ name: "text files", extensions: ["txt"] }],
    })
    .then(({ filePath }) => {
      fs.writeFile(filePath, "", (error) => {
        if (error) {
          handleError();
        } else {
          app.addRecentDocument(filePath);
          openedFilePath = filePath;
          mainWindow.webContents.send("document-created", filePath);
        }
      });
    });
});

function handleError(){
  console.log("cope harder")
}


