import {EditorView, basicSetup} from "codemirror"
//import {javascript} from "@codemirror/lang-javascript"
//import {syntaxTree} from "@codemirror/language"
import type {Diagnostic} from "@codemirror/lint"
import {linter} from "@codemirror/lint"





/* import {parser} from "./syntax.grammar"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language"
import {styleTags, tags as t} from "@lezer/highlight"

export const EXAMPLELanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      foldNodeProp.add({
        Application: foldInside
      }),
      styleTags({
        Identifier: t.variableName,
        LineComment: t.lineComment,
        "( )": t.paren
      })
    ]
  }),
  languageData: {
    commentTokens: {line: "--"}
  }
})

export function EXAMPLE() {
  return new LanguageSupport(EXAMPLELanguage) 
}
*/





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
      to: view.viewport.to/2,
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