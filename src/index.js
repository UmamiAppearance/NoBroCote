import NoBroCote from "./no-bro-cote.js";

const isBrowser = typeof window !== "undefined";
const fileName = isBrowser ? null : process.argv.at(1);

let test;

if (isBrowser) {
    test = new NoBroCote(fileName);
} else {
    const optArgs = process.argv.slice(2);
    const debug = optArgs.includes("debug");
    const failFast = optArgs.includes("failFast");
    test = new NoBroCote(fileName, debug, failFast);
}

export { test, NoBroCote as default };
