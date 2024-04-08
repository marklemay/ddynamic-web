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
  








// // unclear what state this was in
// import { WASI } from "@bjorn3/browser_wasi_shim"; 
// // https://github.com/bjorn3/browser_wasi_shim

// const wasmBinaryPath = "Ffi.wasm";

// // TODO: Factor out the common stuff later
// // --- start of common stuff -------------
// const divToPrintID = "printHere";

// async function initWebAssembly(source) {
//   const wasi = new WASI([], ["LC_ALL=en_US.utf-8"], [/* fds */]);
//   const wasm = await WebAssembly.instantiateStreaming(source, {
//     wasi_snapshot_preview1: wasi.wasiImport,
//   });
//   wasi.inst = wasm.instance;
//   return wasm
// }


// function initHSfromWasm(wasmObj) {
//   const hs = wasmObj.instance.exports;

//   /* A WASI reactor module may export an _initialize function (which, in the Haskell WASM case, will just call the ctors). If this
//   exists, it must be called exactly once before any other exports are
//   called. */
//   hs._initialize();
//   /* hs_init is a part of GHC's runtime system API. It must be called before
//   any other exported Haskell functions are called.
//   The parameters are `argc` and `argv` */ 
//   hs.hs_init(0, 0);

//   return hs;
// }

// function printToDiv(targetDivID, toPrint) {
//   const divToPrint = document.getElementById(targetDivID);
//   const para = document.createElement("p");

//   para.textContent = (toPrint).toString();

//   divToPrint.appendChild(para);
// }

// // --- end of common stuff -------------

// async function main() {
//     console.log("starting main...\n");

//     const wasm = await initWebAssembly(fetch(wasmBinaryPath));
//     const hs = initHSfromWasm(wasm);

//     const decoder = new TextDecoder();
    
//     const i = hs.getNum(4);
//     console.log(i);

//     const resultPtr = hs.getHello();
//     console.log(resultPtri);

//     try {
//       const outStrPtr = hs.getString(resultPtr);
//       const outStrLen = hs.getStringLen(resultPtr);
//       const outputBytes = new Uint8Array(hs.memory.buffer, outStrPtr, outStrLen);
//       const outStr = decoder.decode(outputBytes);

//       printToDiv(divToPrintID, outStr);

//     } finally {
//       hs.freeStrWithLen(resultPtr); // TO EDIT
//     }
//   }

//   main();








// works! but crashes

// import { WASI, File, OpenFile, PreopenDirectory } from "@bjorn3/browser_wasi_shim";

// let args = ["bin", "arg1", "arg2"];
// let env = ["FOO=bar"];
// let fds = [
//     new OpenFile(new File([])), // stdin
//     new OpenFile(new File([])), // stdout
//     new OpenFile(new File([])), // stderr
//     new PreopenDirectory(".", {
//         "example.c": new File(new TextEncoder("utf-8").encode(`#include "a"`)),
//         "hello.rs": new File(new TextEncoder("utf-8").encode(`fn main() { println!("Hello World!"); }`)),
//     }),
// ];
// let wasi = new WASI(args, env, fds);

// let wasm = await WebAssembly.compileStreaming(fetch("repl.wasm"));
// let inst = await WebAssembly.instantiate(wasm, {
//     "wasi_snapshot_preview1": wasi.wasiImport,
// });
// wasi.start(inst);






//Uncaught (in promise) TypeError: exports.mallocPtr is not a function

// import { WASI } from "@bjorn3/browser_wasi_shim";

// async function run() {
//     const wasi = new WASI([], [], []);
//     const wasiImportObj = { wasi_snapshot_preview1: wasi.wasiImport };
//     const wasm = await WebAssembly.instantiateStreaming(fetch("repl.wasm"), wasiImportObj);
//     wasi.inst = wasm.instance;
//     const exports = wasm.instance.exports;
//     const memory = exports.memory;
//     const encoder = new TextEncoder();
//     const decoder = new TextDecoder();

//     const outputPtrPtr = exports.mallocPtr();
//     console.log("Initialized WASI reactor.");

//     self.onmessage = event => {
//         const input = event.data;
//         const inputLen = Buffer.byteLength(input);
//         const inputPtr = exports.malloc(inputLen);
//         const inputArr = new Uint8Array(memory.buffer, inputPtr, inputLen);
//         encoder.encodeInto(input, inputArr);
//         const outputLen = exports.formatRaw(inputPtr, inputLen, outputPtrPtr);
//         const outputPtrArr = new Uint32Array(memory.buffer, outputPtrPtr, 1);
//         const outputPtr = outputPtrArr[0];
//         const outputArr = new Uint8Array(memory.buffer, outputPtr, outputLen);
//         const output = decoder.decode(outputArr);
//         self.postMessage(output);
//         exports.free(outputPtr);
//     };

//     self.postMessage(42);
// }

// run();











// import { WASI } from "wasi-js";
// import fs from "fs";
// import nodeBindings from "wasi-js/dist/bindings/node";

// const wasi = new WASI({
//   args: [],
//   env: {},
//   bindings: {...nodeBindings, fs},
// });

// const source = await readFile(pathToWasm);
// const typedArray = new Uint8Array(source);
// const result = await WebAssembly.instantiate(typedArray, wasmOpts);
// wasi.start(result.instance);








// import WasiContext from "https://deno.land/std/wasi/snapshot_preview1.ts";

// const context = new WasiContext({});

// const instance = (
//   await WebAssembly.instantiate(await Deno.readFile("Hello.wasm"), {
//     wasi_snapshot_preview1: context.exports,
//   })
// ).instance;

// // The initialize() method will call the module's _initialize export
// // under the hood. This is only true for the wasi implementation used
// // in this example! If you're using another wasi implementation, do
// // read its source code to figure out whether you need to manually
// // call the module's _initialize export!
// context.initialize(instance);

// // This function is a part of GHC's RTS API. It must be called before
// // any other exported Haskell functions are called.
// instance.exports.hs_init(0, 0);

// console.log(instance.exports.fib(10));



// console.log("!!!!");


// import WasiContext from "https://deno.land/std/wasi/snapshot_preview1.ts";

// const context = new WasiContext({});

// const instance = (
//   await WebAssembly.instantiate(await Deno.readFile("Hello.wasm"), {
//     wasi_snapshot_preview1: context.exports,
//   })
// ).instance;

// context.initialize(instance);

// // This function is a part of GHC's RTS API. It must be called before
// // any other exported Haskell functions are called.
// instance.exports.hs_init(0, 0);

// console.log(instance.exports.fib(10));



// import { WASI, File, OpenFile, PreopenDirectory } from "@bjorn3/browser_wasi_shim";

// let args = ["bin", "arg1", "arg2"];
// let env = ["FOO=bar"];
// let fds = [
//     new OpenFile(new File([])), // stdin
//     new OpenFile(new File([])), // stdout
//     new OpenFile(new File([])), // stderr
//     new PreopenDirectory(".", {
//         "example.c": new File(new TextEncoder("utf-8").encode(`#include "a"`)),
//         "hello.rs": new File(new TextEncoder("utf-8").encode(`fn main() { println!("Hello World!"); }`)),
//     }),
// ];
// let wasi = new WASI(args, env, fds);

// WebAssembly.compileStreaming(fetch("Ffi.wasm")).then(({ wasm }) => {
//  WebAssembly.instantiate(wasm, {
//     "wasi_snapshot_preview1": wasi.wasiImport,
// }).then(({ inst }) => {
// wasi.start(inst);
// })
//   });



// let wasm = await WebAssembly.compileStreaming(fetch("Ffi.wasm"));
// let inst = await WebAssembly.instantiate(wasm, {
//     "wasi_snapshot_preview1": wasi.wasiImport,
// });
// wasi.start(inst);



// const wasi = new WASI({
//   args: [],
//   env: {},
//   bindings: {...nodeBindings, fs},
// });


// const source = await readFile('./Ffi.wasm');
// const typedArray = new Uint8Array(source);
// const result = await WebAssembly.instantiate(typedArray, wasmOpts);
// wasi.start(result.instance);



// wasm(options).then(({ instance }) => {
//   console.log(instance.exports.main());
// });

// wasm().then(({ wasmModule  }) => {
  
//   console.log("hi");
//   const wasmInstance	= new WebAssembly.Instance(wasmModule);
//   console.log(wasmInstance.exports.main());
//   console.log("thre");
// });


console.log("??????");