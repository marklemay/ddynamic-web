import {EditorView, basicSetup} from "codemirror"
import {linter} from "@codemirror/lint"
//import wasm from './Ffi.wasm';

// import { WASI } from "wasi-js";
// import fs from "fs";
// import nodeBindings from "wasi-js/dist/bindings/node";



import { WASI } from "@bjorn3/browser_wasi_shim"; 
// https://github.com/bjorn3/browser_wasi_shim

const wasmBinaryPath = "Ffi.wasm";


////////////////////////////////////////////////////////////////////////////////
// Haskell Wasm Utilities
////////////////////////////////////////////////////////////////////////////////

function bufferAt(pos, len) {
    return new Uint8Array(inst.exports.memory.buffer, pos, len);
}

function cstringBufferAt(cstr) {
    let b = new Uint8Array(inst.exports.memory.buffer, cstr);
    let l = b.findIndex(i => i == 0, b);
    return bufferAt(cstr, l);
}

function withCStrings(strs, op) {
    const cstrs = strs.map(str => {
        const s = new TextEncoder().encode(str);
        const l = s.length + 1;
        const p = inst.exports.callocBuffer(l);
        const b = new bufferAt(p, l);
        b.set(s);
        return p;
    });
    const r = op(cstrs);
    strs.forEach(inst.exports.freeBuffer);
    return r;
}

function withCString(str, op) {
    return withCStrings([str], strs => op(strs[0]));
}

function fromCString(cstr) {
    const s = new TextDecoder("utf8").decode(cstringBufferAt(cstr));
    inst.exports.freeBuffer(cstr);
    return s;
}

////////////////////////////////////////////////////////////////////////////////
// Application APIs
////////////////////////////////////////////////////////////////////////////////

function echo(str) {
    return fromCString(withCString(str, cstr => inst.exports.echo(cstr)));
}

function store_size() {
    return inst.exports.size();
}

function store_save(k, v) {
    withCStrings([k,v], a => inst.exports.save(a[0], a[1]));
}

function store_load(k) {
    return fromCString(withCString(k, k => inst.exports.load(k)));
}



function cstr1(f,x) {
    return fromCString(withCString(x, k => f(k)));
}

////////////////////////////////////////////////////////////////////////////////
// Application Logic
////////////////////////////////////////////////////////////////////////////////

function test() {
    // console.log("echo:", echo("hello world"));
    // console.log("size before", store_size());
    // store_save("a", "42");
    // store_save("b", "21");
    // console.log("size after", store_size());
    // console.log("a=", store_load("a"));
    // console.log("b=", store_load("b"));
    // console.log("c=", store_load("c"));
    console.log("num:", inst.exports.num(1));
    console.log("numNum:", inst.exports.numNum(2));
    console.log("astr:", cstr1(inst.exports.astr, "hi" ));
    console.log("astr:", cstr1(inst.exports.doublestr, "hi" ));
}


(async function () {
    // load Haskell Wasm Reactor Module
    window.wasm = await WebAssembly.compileStreaming(fetch(wasmBinaryPath));
    window.wasi = new WASI([], ["LC_ALL=en_US.utf-8"], [/* fds */]);
    window.inst = await WebAssembly.instantiate(wasm, {
        "wasi_snapshot_preview1": wasi.wasiImport,
    });

    // initialize Haskell Wasm Reactor Module
    wasi.initialize(inst);
    inst.exports.hs_init(0, 0);

    test();
})()



//TODO rename
const regexpLinter = linter(view => {
    let diagnostics = [] // : Diagnostic[]
    
    console.log("view.state=", view.state.doc.toString()); // probly better sending the list of lines if I could FFI that
    //loadStringJson

    const out = cstr1(inst.exports.loadStringJson,view.state.doc.toString());


    // console.log("out=", out);
    const res = JSON.parse(out);
    // console.log("res=", res);

    // console.log("typeof  res=", typeof  res);
    //console.log("JSON=", res.getKeys(obj));
   
//    console.log("res.tag=", res.tag);
//     console.log("res[tag]=", res["tag"]);
//     console.log("res[tag]=", res["\"tag\""]);
    switch(res["tag"]){
        case "ParseError" :

            diagnostics.push({
                from: res["start"],
                to: res["end"], // inst.exports.numNum(2),
                severity: "error", // error, warning
                message: res["err"]["message"],
              })
            break;
            // TODO deal with rarely occuring TypeError later

        case "Warnings" :

        console.log("res=", res);
        for (const warning of res["warnings"]) {
            console.log("warning=", warning);

            diagnostics.push({
                from: warning.warningStart,
                to: warning.warningEnd,
                severity: "warning",
                message: warning.msg,
              })
        }
        for (const info of res["infos"]) {
            console.log("infos=", info);

            diagnostics.push({
                from: info.infoStart,
                to: info.infoEnd,
                severity: "info",
                message: info.infoMsg,
              })
        }
            break;
    }


    // diagnostics.push({
    //     from: view.viewport.from,
    //     to: view.viewport.to, // inst.exports.numNum(2),
    //     severity: "error", // error, warning
    //     message: "???",
    //   })
    // diagnostics.push({
    //     from: view.viewport.from,
    //     to: Math.floor(view.viewport.to/2), // TODO upsteam as int
    //     severity: "warning", // error, warning  could restyle hint with type info
    //     message: "sodjnf", //view.state.doc.toString(),
    //   })
    return diagnostics
  })
  
  import starterDoc from "./ex/ex.dt";

  new EditorView({
    extensions: [basicSetup, 
    //javascript(),
    //EXAMPLE(),
    regexpLinter
    ],
    doc: starterDoc,
    parent: document.querySelector("#mainEditor")
  })
  
