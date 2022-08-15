#!/usr/bin/env node

import { fork } from "child_process";
import { readdirSync, statSync } from "fs";
import { join as joinPath } from "path";
import picomatch from "picomatch";


const cwd = process.cwd();
const fileList = [];
const reArrMatch = (arr) => new RegExp(arr.join("|"));

const noWayDirs = reArrMatch([
    "\\.git",
    "node_modules",
    "^_[^_]"
]);

const noWayFiles = reArrMatch([
    "^_[^_]"
]);

let matchFiles = picomatch([
    "test.js",
    "src/test.js",
    "source/test.js",
    "**/test-*.js",
    "**/*.spec.js",
    "**/*.test.js",
    "**/test/**/*.js",
    "**/tests/**/*.js",
    "**/__tests__/**/*.js"
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

const collectFiles = (dirPath) => {
    const files = readdirSync(dirPath);
  
    files.forEach(file => {
        
        if (statSync(dirPath + "/" + file).isDirectory()) {
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

const forkPromise = (modulePath) => {
    return new Promise((resolve, reject) => {
        fork(modulePath)
            .on("close", exitCode => resolve(exitCode))
            .on("error", error => reject(error));
    });
};


collectFiles(cwd);

const exitCodes = await Promise.all(
    fileList.map(testFile => forkPromise(testFile))
);
const exitCode = exitCodes.some(code => code !== 0)|0;
process.exit(exitCode);
