import NoBroCote from "./no-bro-cote.js";

const fileName = typeof window === "undefined" ? process.argv.at(-1) : null;
const test = new NoBroCote(fileName);

export { test, NoBroCote as default };
