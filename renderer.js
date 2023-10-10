

// const { ipcRenderer } = require("electron");

// document.addEventListener('DOMContentLoaded', () => {
//   document.getElementById("openDocumentBtn").addEventListener("click", () => {
//     ipcRenderer.send("load-delta", );
//   });
  
//   document.getElementById("saveDocumentBtn").addEventListener("click", () => {
//     ipcRenderer.send("save-delta");
//   });
//   });
// const path = require("path");
// const Quill = require("quill");
// const el = {
//   openDocumentBtn: document.getElementById("openDocumentBtn"),
//   saveDocumentBtn: document.getElementById("saveDocumentBtn"),
// };

//   const handleDocumentChange = (filePath, content = "") => {
//     el.documentName.innerHTML = path.parse(filePath).base;
//     el.fileTextarea.removeAttribute("disabled");
//     el.fileTextarea.focus();
//     var container = document.querySelector("#editor");
//     var quill = new Quill(container);
//     console.log(Quill.find(container) === quill);
//     console.log(content);
//     quill.setContents(content);
//   };

//   el.createDocumentBtn.addEventListener("click", () => {
//     ipcRenderer.send("create-document-triggered");
//   });

//   el.fileTextarea.addEventListener("input", (e) => {
//     var container = document.querySelector("#editor");
//     var quill = new Quill(container);
//     ipcRenderer.send("file-content-updated", JSON.stringify(quill.getContents()));
//     el.fileTextarea.focus();
//   });

//   ipcRenderer.on("document-opened", (_, { filePath, content }) => {
//     handleDocumentChange(filePath, content);
//   });

//   ipcRenderer.on("document-created", (_, filePath) => {
//     handleDocumentChange(filePath);
//   });

  
// });
