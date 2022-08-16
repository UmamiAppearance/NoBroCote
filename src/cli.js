#!/usr/bin/env node

import { fork } from "child_process";
import { readdirSync, readFileSync, statSync } from "fs";
import { join as joinPath } from "path";
import picomatch from "picomatch";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";


// pre definitions
const { nbConfig, version } = (() => {
    const config = JSON.parse(
        readFileSync(
            new URL("../package.json", import.meta.url)
        )
    );
    return {
        nbConfig: config["no-bro-cote"],
        version: config.version
    };
})();


const cwd = process.cwd();
const fileList = [];
const reMatch = (arr) => new RegExp(arr.join("|"));

const noWayDirs = reMatch([
    "^\\.git",
    "node_modules",
    "^_[^_]"
]);

const noWayFiles = reMatch([
    "^_[^_]"
]);

console.log(nbConfig);

const ext = Array.isArray(nbConfig.extensions)
    ? `@(${nbConfig.extensions.join("|")})`
    : "@(js|mjs)";


if (nbConfig.match) nbConfig.files = [ String(nbConfig.match) ];
let matchFiles = Array.isArray(nbConfig.match)
    ? picomatch(nbConfig.files)
    : picomatch([
        `test.${ext}`,
        `src/test.${ext}`,
        `source/test.${ext}`,
        `**/test-*.${ext}`,
        `**/*.spec.${ext}`,
        `**/*.test.${ext}`,
        `**/test/**/*.${ext}`,
        `**/tests/**/*.${ext}`,
        `**/__tests__/**/*.${ext}`
    ]);

let excludeDirs = picomatch([
    "**/__tests__/**/__helper__/**/*",
    "**/__tests__/**/__helpers__/**/*",
    "**/__tests__/**/__fixture__/**/*",
    "**/__tests__/**/__fixtures__/**/*",
    "**/test/**/helper/**/*",
    "**/test/**/helpers/**/*",
    "**/test/**/fixture/**/*",
    "**/test/**/fixtures/**/*",
    "**/tests/**/helper/**/*",
    "**/tests/**/helpers/**/*",
    "**/tests/**/fixture/**/*",
    "**/tests/**/fixtures/**/*"
]);


// command line arguments
const coerceLastValue = value => Array.isArray(value) ? value.pop() : value;
const FLAGS = {
    "fail-fast": {
        coerce: coerceLastValue,
        description: "Stop after first test failure",
        type: "boolean",
    },
    match: {
        alias: "m",
        description: "Only run tests with matching title (can be repeated)",
        type: "string",
    },
    serial: {
        alias: "s",
        coerce: coerceLastValue,
        description: "Run tests serially",
        type: "boolean",
    }
};




// test execution
const collectFiles = (dirPath) => {
    const files = readdirSync(dirPath);
  
    files.forEach(file => {
        
        if (statSync(joinPath(dirPath, file)).isDirectory()) {
            if (!noWayDirs.test(file)) {
                collectFiles(joinPath(dirPath, file));
            }
        }
        
        else {
            if (!noWayFiles.test(file)) {
                const fullPath = joinPath(dirPath, file);
                if (!excludeDirs(fullPath) && matchFiles(fullPath)) {
                    fileList.push(fullPath);
                }
            }
        }
    });
};

const forkPromise = (modulePath, args) => {
    return new Promise((resolve, reject) => {
        fork(modulePath, args)
            .on("close", exitCode => resolve(exitCode))
            .on("error", error => reject(error));
    });
};

collectFiles(cwd);
console.log(fileList);

const defaultRun = async (...args) => {
    const exitCodes = await Promise.all(
        fileList.map(testFile => forkPromise(testFile, args))
    );
    return exitCodes.some(code => code !== 0)|0;
};

const serialRun = async (...args) => {
    const exitCodes = [];
    for (const testFile of fileList) {
        exitCodes.push(await forkPromise(testFile, args));
    }
    return exitCodes.some(code => code !== 0)|0;
};


const exitCode = await defaultRun();
process.exit(exitCode);


/*
TODO: remove from here and ad to docs
OPTIONS:
"files", (str[])
"match", (str) -> overwrites files
"extensions" (array)
*/