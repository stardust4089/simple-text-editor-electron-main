const { ipcRenderer } = require("electron");
const path = require("path");
const { pdfExporter } = require('quill-to-pdf');
var FileSaver = require('file-saver');
var QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
const pdf = require('html-pdf'); // Import the html-pdf module

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

  const handleDocumentChange = (filePath, content = "") => {
    el.documentName.innerHTML = path.parse(filePath).base;
    _filePath = filePath;
    inputText.value = content;
    if (content == "") {
      inputText.value = JSON.stringify([{ insert: 'Notes: ' }]);
    }
  };

  function autosave() {
    console.log("path" + _filepath)
    if (_filepath == "") return;
    console.log("autosaving");
    ipcRenderer.send("save-document", outputText.value);
    el.documentName.innerHTML = path.parse(_filePath).base + " (saved at " + new Date().toLocaleTimeString() + ")";
  }

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
  function exportAsPDF() {
    // var deltaOps = [
    //   { "insert": "Notes: \nDefinition of a limi:\nLet " }, { "insert": { "formula": "f\\left(x\\right)" } }, { "insert": "  be a function defined near the fixed number " }, { "insert": { "formula": "a" } }, { "insert": " . Then the limit of " }, { "insert": { "formula": "f\\left(x\\right)" } }, { "insert": " as " }, { "insert": { "formula": "a" } }, { "insert": " approaches " }, { "insert": { "formula": "x" } }, { "insert": " written " }, { "insert": { "formula": "\\lim_{x->a}f\\left(x\\right)" } }, { "insert": ", equals number " }, { "insert": { "formula": "L" } }, { "insert": "  if the values of " }, { "insert": { "formula": "f\\left(x\\right)" } }, { "insert": "  can be made arbitrarily close to " }, { "insert": { "formula": "L" } }, { "insert": "  by having X be sufficiently close to " }, { "insert": { "formula": "a" } }, { "insert": ", but not equal to " }, { "insert": { "formula": "a" } }, { "insert": ".\n\nExample:\nSuppose a car's given position function in meters is given by " }, { "insert": { "formula": "s\\left(t\\right)\\ =\\ t^2" } }, { "insert": " for " }, { "insert": { "formula": "0\\ \\le t\\le3" } }, { "insert": ". Find the instantaneous velocity at " }, { "insert": { "formula": "t+2" } }, { "insert": " seconds (" }, { "insert": { "formula": "t=2" } }, { "insert": ")." }, { "attributes": { "list": "bullet" }, "insert": "\n" }, { "insert": "Given:" }, { "attributes": { "indent": 1, "list": "bullet" }, "insert": "\n" }, { "insert": { "formula": "s\\left(t\\right)=t^2" } }, { "insert": " at our position" }, { "attributes": { "indent": 2, "list": "bullet" }, "insert": "\n" }, { "insert": "Wanted:" }, { "attributes": { "indent": 1, "list": "bullet" }, "insert": "\n" }, { "insert": "Velocity at " }, { "insert": { "formula": "t=2" } }, { "insert": " " }, { "attributes": { "indent": 2, "list": "bullet" }, "insert": "\n" }, { "insert": "Slope of the tangent line, so the average velocity " }, { "attributes": { "underline": true }, "insert": "near" }, { "insert": " " }, { "insert": { "formula": "t=2" } }, { "insert": " " }, { "attributes": { "indent": 2, "list": "bullet" }, "insert": "\n" }, { "insert": "Expression for avg. velocity on " }, { "insert": { "formula": "\\left[x,2\\right]" } }, { "insert": " " }, { "attributes": { "indent": 1, "list": "bullet" }, "insert": "\n" }, { "insert": { "formula": "m_{\\sec\\ }=\\ \\frac{rise}{run}" } }, { "insert": " " }, { "attributes": { "indent": 2, "list": "bullet" }, "insert": "\n" }, { "insert": { "formula": "\\frac{s\\left(2\\right)-s\\left(s\\right)}{2-x}" } }, { "insert": " " }, { "attributes": { "indent": 2, "list": "bullet" }, "insert": "\n" }, { "insert": { "formula": "\\frac{4-x^2}{2-x}" } }, { "insert": " " }, { "attributes": { "indent": 2, "list": "bullet" }, "insert": "\n" }, { "insert": "Limit:" }, { "attributes": { "indent": 1, "list": "bullet" }, "insert": "\n" }, { "insert": { "formula": "\\lim_{x->2}\\left(\\frac{4-x^2}{2-x}\\right)" } }, { "insert": " " }, { "attributes": { "indent": 2, "list": "bullet" }, "insert": "\n" }, { "insert": "Approaches 4 as " }, { "insert": { "formula": "x" } }, { "insert": " approaches 2" }, { "attributes": { "indent": 2, "list": "bullet" }, "insert": "\n" }, { "insert": "Key fact:" }, { "attributes": { "list": "bullet" }, "insert": "\n" }, { "insert": "When you calculate a limit, if written standard, it is a TWO SIDED LIMT" }, { "attributes": { "indent": 1, "list": "bullet" }, "insert": "\n" }, { "insert": "So it only exists if the both go to the same value. " }, { "attributes": { "indent": 2, "list": "bullet" }, "insert": "\n" }
    // ];
    var deltaOps = JSON.parse(outputText.value.slice(7, -1));
    var cfg = {};

    var converter = new QuillDeltaToHtmlConverter(deltaOps, cfg);

    var html = String("<!DOCTYPE html>" + converter.convert() + "<link rel=\"stylesheet\" href=\"https:\/\/cdn.jsdelivr.net/npm/katex@0.14.0/dist/katex.min.css\"><script src=\"https://cdn.jsdelivr.net/npm/katex@0.14.0/dist/katex.min.js\"></script><script>document.querySelectorAll('.ql-formula').forEach((element) => {katex.render(element.innerText, element, { displayMode: false });});</script>");
    console.log(html);
    FileSaver.saveAs(new Blob([html], { type: "text/pdf;charset=utf-8" }), "export.html");
  }

  // const exportAsPDF = async () => {
  //   const pdfAsBlob = await pdfExporter.generatePdf(JSON.parse(outputText.value)); // converts to PDF
  //   FileSaver.saveAs(pdfAsBlob, "pdf-export.pdf"); // downloads from the browser
  // };
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

