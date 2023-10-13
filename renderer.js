const { ipcRenderer } = require("electron");
const path = require("path");

window.addEventListener('DOMContentLoaded', () => {
  const outputText = document.getElementById("delta-output");
  const inputText = document.getElementById("delta-input");

  const el = {
    documentName: document.getElementById("documentName"),
    // createDocumentBtn: document.getElementById("createDocumentBtn"),
    openDocumentBtn: document.getElementById("openDocumentBtn"),
  };

  const handleDocumentChange = (filePath, content = "") => {
    el.documentName.innerHTML = path.parse(filePath).base;
    inputText.value = content;
  };

  el.fileTextarea.addEventListener("input", (e) => {
    ipcRenderer.send("file-content-updated", e.target.value);
  });

  document.getElementById("openDocumentBtn").addEventListener("click", () => {
    ipcRenderer.send("load-delta");
  });


  el.openDocumentBtn.addEventListener("click", () => {
    ipcRenderer.send("open-document-triggered");
  });

  ipcRenderer.on("document-opened", (_, { filePath, content }) => {
    handleDocumentChange(filePath, content);
  });

  ipcRenderer.on("document-created", (_, filePath) => {
    handleDocumentChange(filePath);
  });
});

