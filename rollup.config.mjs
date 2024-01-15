import {nodeResolve} from "@rollup/plugin-node-resolve"
//import typescript from '@rollup/plugin-typescript' // can wasm and ts coexist?
//import { wasm } from '@rollup/plugin-wasm'; doesn't work?

//import {lezer} from "@lezer/generator/rollup"

export default {
  input: "./editor.js",
  output: {
    file: "./editor.bundle.js",
    format: "es"
  },
  plugins: [nodeResolve()] //,wasm()] //, typescript()] //,lezer()]
}