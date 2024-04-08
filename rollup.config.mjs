import {nodeResolve} from "@rollup/plugin-node-resolve"
//import typescript from '@rollup/plugin-typescript' // can wasm and ts coexist?
//import { wasm } from '@rollup/plugin-wasm'; doesn't work?

//import {lezer} from "@lezer/generator/rollup"
import { string } from "rollup-plugin-string";

export default {
  input: "./editor.js",
  output: {
    file: "./editor.bundle.js",
    format: "es"
  },
  plugins: [nodeResolve(), 
    string({
    // Required to be specified
    include: "ex/*.dt",

    // Undefined by default
    exclude: ["**/index.html"]
  })] //,wasm()] //, typescript()] //,lezer()]
}