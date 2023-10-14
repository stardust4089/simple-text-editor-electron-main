const { ipcRenderer } = require("electron");
const path = require("path");

const { app } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const outputText = document.getElementById("delta-output");
  const inputText = document.getElementById("delta-input");

  var _filepath = "";

  const el = {
    documentName: document.getElementById("documentName"),
    createDocumentBtn: document.getElementById("createDocumentBtn"),
    openDocumentBtn: document.getElementById("openDocumentBtn"),
  };

  const handleDocumentChange = (filePath, content = "") => {
    el.documentName.innerHTML = path.parse(filePath).base;
    _filePath = filePath;
    inputText.value = content;
    if (content == "") {
      inputText.value = JSON.stringify([{ insert: 'Notes: ' }]);
    }
  };

  function autosave(){
    console.log("path" + _filepath)
    if (_filepath == "") return;
    console.log("autosaving");
    ipcRenderer.send("save-document", outputText.value);
    el.documentName.innerHTML = path.parse(_filePath).base + " (saved at " + new Date().toLocaleTimeString() + ")";
  }

  autosave()
  setInterval(autosave, 10000);

  document.getElementById("openDocumentBtn").addEventListener("click", () => {
    autosave();
    ipcRenderer.send("load-delta");
  });


  el.openDocumentBtn.addEventListener("click", () => {
    autosave();
    ipcRenderer.send("open-document-triggered");
  });

  ipcRenderer.on("document-opened", (_, { filePath, content }) => {
    _filepath = filePath;
    handleDocumentChange(filePath, content);
    autosave();
  });

  ipcRenderer.on("document-created", (_, filePath) => {
    _filepath = filePath;
    handleDocumentChange(filePath);
    autosave();
  });

  el.createDocumentBtn.addEventListener("click", () => {
    ipcRenderer.send("create-document-triggered");
  });

  ipcRenderer.on("save", () => {
    autosave();
  });
});

