const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { Console, clear } = require('console');
const { send } = require('process');


// const isDevEnv = process.env.NODE_ENV === 'development';
// if (isDevEnv) {
//   try {
//     require('electron-reloader')(module);
//   } catch { }
// }

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


  // if (isDevEnv) {
  //   mainWindow.webContents.openDevTools();
  // }
  mainWindow.webContents.openDevTools();
  // // Attach context menu to the webContents

  // // Set up the SpellCheckHandler
  // SpellCheckHandler.attachTo(webContents);
  mainWindow.loadFile('index.html');
  const { Menu, MenuItem } = require('electron')
  sendRecentFiles();
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

app.whenReady().then(() => {
  createWindow();
  sendRecentFiles();
});

const sendRecentFiles = () => {
  const recentFilesPath = path.join(app.getPath('userData'), 'recentFiles.json');
  fs.readFile(recentFilesPath, (error, data) => {
    if (error) {
      clearRecentFiles();
      console.error('Error reading recent files:', error);
    } else {
      let recentFiles = JSON.parse(data);
      // Get the modification date of each file
      Promise.all(recentFiles.map(file => {
        return new Promise((resolve, reject) => {
          fs.stat(file, (error, stats) => {
            if (error) {
              reject(error);
            } else {
              resolve({ path: file, dateModified: stats.mtime });
            }
          });
        });
      }))
        .then(files => {
          // Sort the files by date modified
          files.sort((a, b) => b.dateModified - a.dateModified);
          // Send the sorted list of files to the renderer process
          mainWindow.webContents.send('recent-files', files.map(file => file.path));
        })
        .catch(error => {
          console.error('Error getting file stats:', error);
        });
    }
  });
};

ipcMain.on("clear-recent-files", () => {
  const recentFilesPath = path.join(app.getPath('userData'), 'recentFiles.json');
  fs.writeFile(recentFilesPath, "[]", (error) => {
    if (error) {
      console.error('Error clearing recent files:', error);
    } else {
      sendRecentFiles();
    }
  });
});

ipcMain.on('loaded-page', () => {
  sendRecentFiles();
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

const addNewRecentDocument = (filePath) => {
  const recentFilesPath = path.join(app.getPath('userData'), 'recentFiles.json');
  fs.readFile(recentFilesPath, (error, data) => {
    let recentFiles;
    if (error) {
      recentFiles = [];
    } else {
      recentFiles = JSON.parse(data);
    }

    // Check if the file is already in the list
    if (!recentFiles.includes(filePath)) {
      // If not, add it to the list
      recentFiles.push(filePath);
      fs.writeFile(recentFilesPath, JSON.stringify(recentFiles), (error) => {
        if (error) {
          console.error('Error storing recent files:', error);
        }
      });
    }
  });
};

ipcMain.on("add-new-recent-document", (event, filePath) => {
  addNewRecentDocument(filePath);
});


ipcMain.on("open-document-triggered", () => {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "delta files", extensions: ["delta"] }],
    })
    .then(({ filePaths }) => {
      const filePath = filePaths[0];

      openFile(filePath);
      addNewRecentDocument(filePath);
      sendRecentFiles();
    });
});

ipcMain.on("opened-recent-document", (_, filePath) => {
  openFile(filePath);
});

ipcMain.on("open-tab-document", (_, filePath) => {
  openFile(filePath);
  addNewRecentDocument(filePath);

});

ipcMain.on("create-document-triggered", () => {
  dialog
    .showSaveDialog(mainWindow, {
      filters: [{ name: "delta files", extensions: ["delta"] }],
    })
    .then(({ filePath }) => {
      fs.writeFile(filePath, "", (error) => {
        if (error) {
          handleError();
        } else {
          app.addRecentDocument(filePath);
          openedFilePath = filePath;
          mainWindow.webContents.send("document-created", filePath);
          addNewRecentDocument(filePath);
          sendRecentFiles();
        }
      });
    });
});

app.on('before-quit', () => {
  mainWindow.webContents.send('save');
});

app.on('ready', () => {
  // Register this app as the default handler for .delta files
  app.setAsDefaultProtocolClient('delta');
});

app.on('open-url', (event, url) => {
  app.addRecentDocument(url);
  openedFilePath = url;
  openFile(url);
});

ipcMain.on("save-document", (_, textareaContent) => {
  if (openedFilePath == null) {
    console.error("filePath was null");
    return;
  }
  fs.writeFile(openedFilePath, textareaContent, (error) => {
    if (error) {
      handleError();
    }
  });
});

ipcMain.on("export-delta", (html) => {
  dialog
    .showSaveDialog(mainWindow, {
      filters: [{ name: "html files", extensions: ["html"] }],
    })
    .then(({ filePath }) => {
      fs.writeFile(filePath, html, (error) => {
        if (error) {
          handleError();
        }
      });
    });
});

// Handle loading of the second page
ipcMain.on('load-editor-page', () => {
  mainWindow.loadFile('index.html');
});

function handleError() {
  console.log("cope harder")
}


