const { ipcRenderer } = require('electron');

// Send a message to the main process
ipcRenderer.send('some-channel', 'Message from renderer process');

// Listen for a response from the main process
ipcRenderer.on('main-process-response', (event, arg) => {
  console.log('Received from main process:', arg);
});
