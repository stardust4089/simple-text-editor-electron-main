const { ipcRenderer } = require("electron");
const path = require("path");
const { pdfExporter } = require('quill-to-pdf');
var FileSaver = require('file-saver');
var QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
const pdf = require('html-pdf'); // Import the html-pdf module
const { error } = require("console");
var outputText;
var inputText;
var filepath = "";
const maximumRecentFiles = 10;

window.addEventListener('DOMContentLoaded', () => {

  const outputText = document.getElementById("delta-output");
  const inputText = document.getElementById("delta-input");

  var _filepath = "";
  var currentTabs = new Set();
  var numtabs = 0;
  const el = {
    documentName: document.getElementById("documentName"),
    createDocumentBtn: document.getElementById("createDocumentBtn"),
    openDocumentBtn: document.getElementById("openDocumentBtn"),
    exportDocumentBtn: document.getElementById("exportDocumentBtn"),
    printDocumentBtn: document.getElementById("printDocumentBtn"),
    newTabBtn: document.getElementById("newTab"),
    tabsBar: document.getElementById("tabs-bar"),
    closeTabBtn: document.getElementById("closeTabBtn"),
    editor: document.getElementById("editor"),
    mainContainer: document.getElementById("main-container"),
    loadContainer: document.getElementById("load-container"),
  };

  autosave();
  
  outputText.addEventListener("change", () => {
    autosave();
  });

  document.getElementById("openDocumentBtn").addEventListener("click", () => {
    autosave();
    ipcRenderer.send("load-delta");
  });

  el.printDocumentBtn.addEventListener("click", () => {
    autosave();
    print();
  });

  el.newTabBtn.addEventListener("click", () => {
    ipcRenderer.send("create-document-triggered");
  });

  el.closeTabBtn.addEventListener("click", () => {
    closeTab(_filepath);
  });

  el.exportDocumentBtn.addEventListener("click", () => {
    autosave();
    exportAsPDF();
  });

  el.openDocumentBtn.addEventListener("click", () => {
    autosave();
    ipcRenderer.send("open-document-triggered");
  });

  el.createDocumentBtn.addEventListener("click", () => {
    ipcRenderer.send("create-document-triggered");
  });

  function newTab(file_path) {
    currentTabs.add(file_path);
    numtabs++;
    let tab = document.createElement('x-tab');
    tab.textContent = path.parse(file_path).base;

    tab.addEventListener('click', () => {
      ipcRenderer.send("open-tab-document", file_path);
    });

    tab.id = file_path;
    el.tabsBar.prepend(tab);
    tab.click();
  }

  function closeTab(file_path) {
    currentTabs.delete(file_path);
    autosave();
    numtabs--;
    el.tabsBar.removeChild(document.getElementById(file_path));
    if (numtabs == 0) {
      openLoadWindow();
    } else {
      el.tabsBar.firstChild.click();
    }
  }

  function openLoadWindow() {
    setFilePathGlobal("no file selected")
    el.editor.style.display = "none";
    el.mainContainer.style.display = "none";
    document.getElementsByClassName("ql-toolbar")[0].style.display = "none";
    el.loadContainer.style.display = "block";
  }

  function closeLoadWindow() {
    el.editor.style.display = "block";
    el.mainContainer.style.display = "block";
    document.getElementsByClassName("ql-toolbar")[0].style.display = "block";
    el.loadContainer.style.display = "none";
  }

  function setFilePathGlobal(file_path) {
    try {
      el.documentName.innerHTML = path.parse(file_path).base;
    }
    catch(error){
      el.documentName.innerHTML = file_path;
    }
    _filepath = file_path;
  }

  const handleDocumentChange = (filePath, content = "") => {
    el.documentName.innerHTML = path.parse(filePath).base;
    _filePath = filePath;
    inputText.value = content;
    if (content == "") {
      inputText.value = JSON.stringify([{ insert: 'Notes: ' }]);
    }
  };

  const { ipcRenderer } = require('electron');
  ipcRenderer.send('loaded-page');



  ipcRenderer.on("recent-files", (event, recentFiles) => {
    let recentFilesElement = document.getElementById('recentFiles');
    // Clear the current list
    while (recentFilesElement.firstChild) {
      recentFilesElement.removeChild(recentFilesElement.firstChild);
    }
    var interations = 0;
    // Add the recent files to the list
    recentFiles.forEach(file => {
      if (interations >= maximumRecentFiles) { return; }
      interations++;
      let fileElement = document.createElement('x-card');
      let textElement = document.createElement('p');
      textElement.textContent = file;
      fileElement.appendChild(textElement);
      fileElement.addEventListener('click', () => {
        newTab(file);
        ipcRenderer.send("open-tab-document", file);
        ipcRenderer.send("add-new-recent-document", file);
      });
      recentFilesElement.appendChild(fileElement);
    });
  });

  function autosave() {
    if (_filepath == "" || _filepath == null) {
      return;
    }
    ipcRenderer.send("save-document", outputText.value);
    el.documentName.innerHTML = path.parse(_filepath).base + " (saved at " + new Date().toLocaleTimeString() + ")";
  }


  function exportAsPDF() {
    var deltaOps = JSON.parse(outputText.value.slice(7, -1));
    var cfg = {};

    var converter = new QuillDeltaToHtmlConverter(deltaOps, cfg);

    var html = String("<!DOCTYPE html>" + converter.convert() + "<link rel=\"stylesheet\" href=\"https:\/\/cdn.jsdelivr.net/npm/katex@0.14.0/dist/katex.min.css\"><script src=\"https://cdn.jsdelivr.net/npm/katex@0.14.0/dist/katex.min.js\"></script><script>document.querySelectorAll('.ql-formula').forEach((element) => {katex.render(element.innerText, element, { displayMode: false });});</script>");
    FileSaver.saveAs(new Blob([html], { type: "text/pdf;charset=utf-8" }), "export.html");
  }

  ipcRenderer.on("document-opened", (_, { filePath, content }) => {
    autosave();
    if (_filepath == filePath) {
      return;
    }
    _filepath = filePath;
    handleDocumentChange(filePath, content);
    autosave();
    closeLoadWindow();
    if (!currentTabs.has(filePath)) {
      newTab(filePath);
    }
  });

  ipcRenderer.on("document-created", (_, filePath) => {
    closeLoadWindow();
    _filepath = filePath;
    handleDocumentChange(filePath);
    autosave();
    if (!currentTabs.has(filePath)) {
      newTab(filePath);
    }
  });

  ipcRenderer.on("save", () => {
    autosave();
  });


});

