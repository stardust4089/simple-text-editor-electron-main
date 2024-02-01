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
  var currentTabs= [];
  var numtabs = 0;
  const el = {
    documentName: document.getElementById("documentName"),
    createDocumentBtn: document.getElementById("createDocumentBtn"),
    openDocumentBtn: document.getElementById("openDocumentBtn"),
    exportDocumentBtn: document.getElementById("exportDocumentBtn"),
    printDocumentBtn: document.getElementById("printDocumentBtn"),
    newTabBtn: document.getElementById("newTab"),
    tabsBar: document.getElementById("tabs-bar"),
    // saveDocumentBtn: document.getElementById("saveDocumentBtn"),
  };

    autosave()
    outputText.addEventListener("change", ()=> {
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

    // el.saveDocumentBtn.addEventListener("click", () => {
    //   autosave();
    // });

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

  function newTab(file_path){
    currentTabs.push(file_path);
    numtabs++;
    let tab = document.createElement('x-tab');
    tab.textContent = path.parse(file_path).base;
    tab.addEventListener('click', () => {
      ipcRenderer.send("open-tab-document", file_path);
      handleDocumentChange(file_path);
    });
    el.tabsBar.appendChild(tab);
    tab.click();
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
      let fileElement = document.createElement('x-card');
      // fileElement.textContent = file;
      // fileElement.className = 'pure-button'; // Add a class for styling
      // Add an icon to the file element
      // let iconElement = document.createElement('img');
      // iconElement.src = 'images/description.png'; // Replace with the path to your icon
      // iconElement.className = 'file-icon'; // Add a class for styling

      let textElement = document.createElement('p');
      // let mainElement = document.createElement('main');
      textElement.textContent = file;
      fileElement.appendChild(textElement);
      // fileElement.prepend(iconElement);
      fileElement.addEventListener('click', () => {
        _filepath = file;
        ipcRenderer.send("opened-recent-document", file);
        ipcRenderer.send("add-new-recent-document", file);
        handleDocumentChange(file);
        newTab(file);
      });
      recentFilesElement.appendChild(fileElement);
    });
  });

  function autosave() {
    console.log("Attemting autosaving")
    console.log("Filepath: " + _filepath)
    if (_filepath == "" || _filepath == null){
      console.log("No filepath")
      return;
    } 
    console.log("autosaving path " + _filepath)
    ipcRenderer.send("save-document", outputText.value);
    el.documentName.innerHTML = path.parse(_filepath).base + " (saved at " + new Date().toLocaleTimeString() + ")";
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
    if (_filepath == filePath){
      return;
    }
    _filepath = filePath;
    // loadEditor();
    handleDocumentChange(filePath, content);
    autosave();
    if (!currentTabs.includes(filePath)){
      newTab(filePath);}
  });

  ipcRenderer.on("document-created", (_, filePath) => {
    _filepath = filePath;
    // loadEditor();
    handleDocumentChange(filePath);
    autosave();
    if (!currentTabs.includes(filePath)){
      newTab(filePath);}
  });

  ipcRenderer.on("save", () => {
    autosave();
  });


});

