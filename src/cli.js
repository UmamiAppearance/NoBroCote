#!/usr/bin/env node

import { blue, red, underline } from "colorette";
import { fork } from "child_process";
import { readdir, readFile, stat } from "fs/promises";
import { isMatch } from "matcher";
import { join as joinPath } from "path";
import picomatch from "picomatch";
import AbortablePromise from "promise-abortable";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { FailedError } from "./utils.js";


const CWD = process.cwd();
const isDirectory = async filePath => (await stat(filePath)).isDirectory();
const reMatch = (arr) => new RegExp(arr.join("|"));


// config values
const { config, version } = await (async () => {
    const conf = JSON.parse(
        await readFile(
            new URL("../package.json", import.meta.url)
        )
    );
    return {
        config: conf["no-bro-cote"] || {},
        version: conf.version
    };
})();

if (!Array.isArray(config.extensions)) {
    config.extensions = ["js", "mjs"];
}


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


const {argv} = yargs(hideBin(process.argv))
    .version(version)
    .usage("$0 [<pattern>...]")
    .command("* [<pattern>...]", "Run tests", yargs => yargs.options(FLAGS).positional("pattern", {
        array: true,
        // TODO: Adjust text
        describe: "Select which test files to run. Leave empty if you want no-bro-cote to run all test files as per your configuration. Accepts glob and minimatch patterns, directories that (recursively) contain test files, and relative or absolute file paths.",
        type: "string",
    }));


// apply command line arguments
const runnerArgs = [];
let userDefFiles = false;

if (argv.debug) {
    runnerArgs.push("debug");
    argv.serial = true;
}

if (argv.pattern) {
    config.files = [];
    for (let pattern of argv.pattern) {
        
        if (pattern.at(0) === "." || pattern.at(0) === "/") {
            
            // convert relative paths to absolute
            if (pattern.at(0) === ".") {
                pattern = joinPath(CWD, pattern);
            }
            
            // if the path contains no * and it is a directory
            // two ** will get appended to convert it into a 
            // valid minimatch patter
            if (!pattern.includes("*")) {
                let isDir = false;
                try {
                    isDir = await isDirectory(pattern);
                } catch {
                    continue;
                }
                if (isDir) {
                    pattern = joinPath(pattern, "**"); 
                }
            }
        }
        config.files.push(pattern);
    }

    if (config.files.length) {
        userDefFiles = true;
    }
}

if (argv.m) {
    config.match = argv.m;
    userDefFiles = true;
}

if (argv.failFast) {
    runnerArgs.push("failFast");
}


// files
const noWayDirs = reMatch([
    "^\\.git(:?hub)?$",
    "^node_modules$",
    "^_[^_]"
]);

const noWayFiles = reMatch([
    "^_[^_]"
]);

const ext = `@(${config.extensions.join("|")})`;

const ensureExtension = reMatch(
    config.extensions
        .map(ext => `\\.${ext}$`)
);



// default match params
let matchFiles;
if (config.match) {
    matchFiles = str => isMatch(str, config.match);
} else {
    matchFiles = userDefFiles
        ? picomatch(config.files)
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
}

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


// file collecting fn
const collectFiles = async () => {
    const fileList = [];
    
    const collect = async dirPath => {
        const files = await readdir(dirPath);
    
        for (const file of files) {
            
            if (await isDirectory(joinPath(dirPath, file))) {
                if (!noWayDirs.test(file)) {
                    await collect(joinPath(dirPath, file));
                }
            }
            
            else {
                if (!noWayFiles.test(file) && ensureExtension.test(file)) {
                    const fullPath = joinPath(dirPath, file);
                    if (!excludeDirs(fullPath) && matchFiles(fullPath)) {
                        fileList.push(fullPath);
                    }
                }
            }
        }
    };

    await collect(CWD);

    if (!fileList.length) {
        console.error(red(underline("\nFailed: Could not collect any test file(s)\n")));
        process.exit(3);
    }
    
    return fileList;
};


// abortable fork as promise
const forkPromise = (modulePath, args) => {

    const controller = new AbortController();
    
    const promise = new AbortablePromise((resolve, reject, signal) => {
        
        signal.onabort = (n) => {
            let err;
            if (n === 2) {
                err = new FailedError(underline(red("\nAn error occurred! Due to the fail fast flag all tests were stopped.\n")));
            } else {
                err = new Error("Aborted");
                controller.abort();
            }
            reject(err);
        };
        
        fork(modulePath, args, { signal: controller.signal })
            .on("close", exitCode => {
                if (exitCode === 2) {
                    promise.abort(2);
                } else {
                    resolve(exitCode);
                }
            })
            .on("error", error => reject(error));
    });

    return promise;
};


// runners
const defaultRun = async (fileList, args) => {
    const tests = fileList.map(testFile => forkPromise(testFile, args));

    let exitCodes = [];
    try {
        exitCodes = await Promise.all(tests);
    } catch (err) {
        if (err.name === "FailedError") {
            tests.forEach(p => p.abort());
            console.error(err.message);
            return 2;
        }
        return 4;
        
    }
    return exitCodes.some(code => code !== 0)|0;
};

const serialRun = async (fileList, args) => {
    const exitCodes = [];
    for (const testFile of fileList) {
        
        if (argv.debug) {
            console.log(blue(underline(`\nRunning Test File: '${testFile}'`)));
        }
        
        const test = forkPromise(testFile, args);
        let exitCode;
        try {
            exitCode = await test;
        } catch (err) {
            if (err.name === "FailedError") {
                test.abort();
                console.error(err.message);
                return 2;
            }
            return 4;
        }

        exitCodes.push(exitCode);
        
        if (argv.debug) {
            console.log(blue(`___\nCompleted Test File: '${testFile}'\n`));
        }
    }

    return exitCodes.some(code => code !== 0)|0;
};


// test execution
const fileList = await collectFiles(CWD);

const exitCode = argv.serial
    ? await serialRun(fileList, runnerArgs)
    : await defaultRun(fileList, runnerArgs);

process.exit(exitCode);

/*
TODO: remove from here and ad to docs
OPTIONS:
"files", (str[])
"match", (str) -> overwrites files
"extensions" (array)
*/