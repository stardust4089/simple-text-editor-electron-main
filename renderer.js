const { ipcRenderer } = require("electron");
const path = require("path");
const { pdfExporter } = require('quill-to-pdf');
var FileSaver = require('file-saver');
var QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
const pdf = require('html-pdf'); // Import the html-pdf module
var outputText;
var inputText;
var filepath = "";

window.addEventListener('DOMContentLoaded', () => {

  const outputText = document.getElementById("delta-output");
  const inputText = document.getElementById("delta-input");

  var _filepath = "";

  const el = {
    documentName: document.getElementById("documentName"),
    createDocumentBtn: document.getElementById("createDocumentBtn"),
    openDocumentBtn: document.getElementById("openDocumentBtn"),
    exportDocumentBtn: document.getElementById("exportDocumentBtn"),
    printDocumentBtn: document.getElementById("printDocumentBtn"),
    saveDocumentBtn: document.getElementById("saveDocumentBtn"),
  };

    autosave()
    setInterval(autosave, 1000);

    document.getElementById("openDocumentBtn").addEventListener("click", () => {
      autosave();
      ipcRenderer.send("load-delta");
    });

    el.printDocumentBtn.addEventListener("click", () => {
      autosave();
      print();
    });

    el.saveDocumentBtn.addEventListener("click", () => {
      autosave();
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
  

  function loadEditor(){
    ipcRenderer.send("load-editor-page");
    onIndexLoad();
  }


  const handleDocumentChange = (filePath, content = "") => {
    el.documentName.innerHTML = path.parse(filePath).base;
    _filePath = filePath;
    inputText.value = content;
    if (content == "") {
      inputText.value = JSON.stringify([{ insert: '' }]);
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
    // Add the recent files to the list
    recentFiles.forEach(file => {
      let fileElement = document.createElement('div');
      fileElement.textContent = file;
      // Add an icon to the file element
      let iconElement = document.createElement('img');
      iconElement.src = 'images/description.png'; // Replace with the path to your icon
      iconElement.className = 'file-icon'; // Add a class for styling
      fileElement.prepend(iconElement);
      fileElement.prepend(iconElement);
      fileElement.addEventListener('click', () => {
        handleDocumentChange(file);
        ipcRenderer.send("add-new-recent-document", file);
      });
      recentFilesElement.appendChild(fileElement);
    });
  });

  function autosave() {
    if (_filepath == "" || _filepath == null) return;
    console.log("autosaving path" + _filepath)
    ipcRenderer.send("save-document", outputText.value);
    el.documentName.innerHTML = path.parse(_filePath).base + " (saved at " + new Date().toLocaleTimeString() + ")";
  }


  function exportAsPDF() {
    var deltaOps = JSON.parse(outputText.value.slice(7, -1));
    var cfg = {};

    var converter = new QuillDeltaToHtmlConverter(deltaOps, cfg);

    var html = String("<!DOCTYPE html>" + converter.convert() + "<link rel=\"stylesheet\" href=\"https:\/\/cdn.jsdelivr.net/npm/katex@0.14.0/dist/katex.min.css\"><script src=\"https://cdn.jsdelivr.net/npm/katex@0.14.0/dist/katex.min.js\"></script><script>document.querySelectorAll('.ql-formula').forEach((element) => {katex.render(element.innerText, element, { displayMode: false });});</script>");
    console.log(html);
    FileSaver.saveAs(new Blob([html], { type: "text/pdf;charset=utf-8" }), "export.html");
  }

  ipcRenderer.on("document-opened", (_, { filePath, content }) => {
    _filepath = filePath;
    // loadEditor();
    handleDocumentChange(filePath, content);
    autosave();
  });

  ipcRenderer.on("document-created", (_, filePath) => {
    _filepath = filePath;
    // loadEditor();
    handleDocumentChange(filePath);
    autosave();
  });

  ipcRenderer.on("save", () => {
    autosave();
  });


});

