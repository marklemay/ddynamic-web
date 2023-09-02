import {EditorView, basicSetup} from "codemirror"
import type {Diagnostic} from "@codemirror/lint"
import {linter} from "@codemirror/lint"


const regexpLinter = linter(view => {
  let diagnostics: Diagnostic[] = []
  diagnostics.push({
      from: view.viewport.from,
      to: view.viewport.to,
      severity: "error", // error, warning
      message: "???",
    })
  diagnostics.push({
      from: view.viewport.from,
      to: Math.floor(view.viewport.to/2),
      severity: "warning", // error, warning  could restyle hint with type info
      message: "sodjnf", //view.state.doc.toString(),
    })
  return diagnostics
})

let editor = new EditorView({
  extensions: [basicSetup, 
  //javascript(),
  //EXAMPLE(),
  regexpLinter
  ],
  parent: document.body
})