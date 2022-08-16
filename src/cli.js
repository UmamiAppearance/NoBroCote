#!/usr/bin/env node

import { fork } from "child_process";
import { readdirSync, readFileSync, statSync } from "fs";
import { join as joinPath } from "path";
import picomatch from "picomatch";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";


const cwd = process.cwd();
const fileList = [];
const reMatch = (arr) => new RegExp(arr.join("|"));


// config values
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


// command line arguments
const coerceLastValue = value => Array.isArray(value) ? value.pop() : value;
const FLAGS = {
    "debug": {
        coerce: coerceLastValue,
        description: "Enable debug mode",
        type: "boolean",
    },
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




// files
const noWayDirs = reMatch([
    "^\\.git(:?hub)?$",
    "node_modules",
    "^_[^_]"
]);

const noWayFiles = reMatch([
    "^_[^_]"
]);

const ext = Array.isArray(nbConfig.extensions)
    ? `@(${nbConfig.extensions.join("|")})`
    : "@(js|mjs)";


if (nbConfig.match) nbConfig.files = [ String(nbConfig.match) ];
let userDefFiles = Array.isArray(nbConfig.match);

const {argv} = yargs(hideBin(process.argv))
    .version(version)
    .usage("$0 [<pattern>...]")
    .command("* [<pattern>...]", "Run tests", yargs => yargs.options(FLAGS).positional("pattern", {
        array: true,
        describe: "Select which test files to run. Leave empty if you want no-bro-cote to run all test files as per your configuration. Accepts glob patterns, directories that (recursively) contain test files, and file paths optionally suffixed with a colon.",
        type: "string",
    }));


console.log(argv);
const args = [];
if (argv.debug) {
    args.push("debug");
    argv.serial = true;
}
if (argv.m) {
    userDefFiles = true;
    nbConfig.files = Array.isArray(argv.m)
        ? [ argv.m ]
        : argv.m;
}





let matchFiles = userDefFiles
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

let excludeDirs = userDefFiles
    ? () => false
    : picomatch([
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

if (!fileList.length) {
    console.error("Could not collect any test file(s)");
    process.exit(1);
}

const defaultRun = async (...args) => {
    const exitCodes = await Promise.all(
        fileList.map(testFile => forkPromise(testFile, args))
    );
    return exitCodes.some(code => code !== 0)|0;
};

const serialRun = async (...args) => {
    const exitCodes = [];
    for (const testFile of fileList) {
        
        if (argv.debug) {
            console.log(`\nRunning Test File: '${testFile}' >>>`);
        }
        
        exitCodes.push(await forkPromise(testFile, args));
        
        if (argv.debug) {
            console.log(`<<< Completed Test File: '${testFile}'\n`);
        }
    }
    return exitCodes.some(code => code !== 0)|0;
};


const exitCode = argv.serial ? await serialRun(args) : await defaultRun(args);
process.exit(exitCode);

/*
TODO: remove from here and ad to docs
OPTIONS:
"files", (str[])
"match", (str) -> overwrites files
"extensions" (array)
*/