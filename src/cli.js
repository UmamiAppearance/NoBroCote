#!/usr/bin/env node

import { fork } from "child_process";
import { readdirSync, statSync } from "fs";
import { join as joinPath } from "path";


const arrayToRegexp = (arr) => new RegExp(arr.join("|"));

const cwd = process.cwd();
const fileList = [];

const excludeDirList = [ "^\\.", "node_modules", "fixtures?", "^_[^_]" ];
const excludeDirRegex = arrayToRegexp(excludeDirList);

const excludeFileList = [ "^\\.", "^_" ];
const excludeFileRegex = arrayToRegexp(excludeFileList);

const extensionsList = [ "\\.js$" ];
const extensionsRegex = arrayToRegexp(extensionsList);


const collectFiles = (dirPath) => {
    const files = readdirSync(dirPath);
  
    files.forEach(file => {
        
        if (statSync(dirPath + "/" + file).isDirectory()) {
            if (!excludeDirRegex.test(file)) {
                collectFiles(joinPath(dirPath, file));
            }
        }
        
        else {
            if (
                !excludeFileRegex.test(file) &&
                extensionsRegex.test(file)
            ){
                const fullPath = joinPath(dirPath, file);

                if (
                    (/\/tests?\/|__tests__/).test(fullPath) ||
                    (/^test-|\.(?:test|spec)\.js$/).test(file) ||
                    (/(?:src|source)\/test.js$/).test(fullPath)
                ) {
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