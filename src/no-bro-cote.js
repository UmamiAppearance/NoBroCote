/*
 * [NoBroCote]{@link https://github.com/UmamiAppearance/NoBroCote}
 *
 * @version 0.1.0
 * @author UmamiAppearance [mail@umamiappearance.eu]
 * @license GPL-3.0
 */


// Imports are done asynchronously and on the fly.
// Otherwise the imports would probably look like
// so:
// -------------------------------------------------- //
// import { NoBroCoteHTMLServer } from "./server.js";
// import { readFileSync } from "fs";
// import { fileURLToPath } from "url";
// -------------------------------------------------- //


/**
 * Main class. Instances of this class are hybrids
 * of prototypes for creating unit tests and are
 * also working as HTM test runners.
 */
class NoBroCote {

    /**
     * Create a new NoBroCode instance. 
     * Kindly pass 'import.meta.url'
     * @param {string} fileName - import.meta.url
     */
    constructor(fileName) {

        // name of the instance file
        this.fileName = fileName;
        
        // results obj for the test runner
        this.results = {
            tests: 0,
            errors: 0,
            errorMessages: new Object()
        };

        // possible error types (can be extended)
        this.errorList = [
            "",
            "EvalError",
            "InternalError",
            "RangeError",
            "ReferenceError",
            "SyntaxError",
            "TypeError",
            "URIError"
        ];

        // true if first called by node, false during tests 
        this.initialize = typeof window === "undefined";
        
        // store project root for initialization
        if (this.initialize) {
            this.rootDir = process.cwd();
        }
        
        // prepare imports and unit array and object
        this.imports = new Array();
        this.units = new Object();
    }


    /**
     * Imports for the test runner html page
     * @param {(string|string[])} imports 
     */
    addImport(imports) {
        if (!this.initialize) {
            return;
        }

        if (typeof imports === "string") {
            this.imports.push(imports);
        } else if (Array.isArray(imports)) {
            this.imports.push(...imports);
        } else {
            throw new TypeError("Imports must be a string or an array of strings.");
        }
    }


    /**
     * Helper function. Compares expected and
     * actual results. Handles operators for
     * the expect value. 
     */
    #assert(result, expect, unit, input) {
        const error = () => this.#makeError(input, result, expect, unit);

        if (expect.match(/^!\|/)) { 
            if (result === expect.replace(/^!\|/, "")) error();
        } 
        
        else if (expect.match(/^\|\|/)) {
            const valid = expect.split("|").slice(2);
            if (!valid.includes(result)) error();
        }

        else if (expect.match(/^==\|/)) {
            if (result != expect.replace(/^==\|/, "")) error();
        }
        
        else if (result !== expect) {
            error();
        }
    }


    /**
     * Creates a test unit.
     * @param {string} name - Unit Name
     * @param {*} expect - expected result 
     * @param {Function} fn - The actual test. A function for testing.
     * @param  {...any} [fnArgs] - Optional. Parameters for the function. 
     */
    makeUnit(name, expect, fn, ...fnArgs) {
        
        if (name in this.units) {
            throw new Error(`Unit ${name} already exists.`);
        }

        this.units[name] = async () => {
            let result;
            const inputStr = `Function: '${fn.name ? fn.name : "anonymous"}', Arguments: ${fnArgs.length ? fnArgs.join(", ") : "none"}`;
            
            try {
                result = await fn(...fnArgs);
            } catch(err) {
                const exception = `${err.name} happened, while running ${name}: '${err.message}'`;
                
                let throwErr = true;
                
                if (expect.match(/^e|/)) {
                    const errType = expect.replace(/^(e\|)/, "");
                    if (this.errorList.includes(errType) && (errType === "" || err.name === errType)) {
                        throwErr = false;
                    }
                }

                if (throwErr) {
                    this.#makeError(inputStr, exception, expect, name);
                }
            }

            if (result) this.#assert(result, expect, name, inputStr);
        };
    }


    /**
     * Helper function. Creates an error is
     * the results object. 
     */
    #makeError(input, output, expected, unit) {
        
        this.results.errors ++;
        const errObj = {
            input: input,
            output: output,
            expected: expected,
            unit: unit
        };
        
        this.results.errorMessages[unit] = errObj;
    }


    /**
     * The final thing to do, when creating a test
     * group is calling this init function to make
     * it work.
     */
    async init() {
        if (!this.initialize) {
            return;
        }
        
        let content, relClassPath;
        [content, relClassPath] = await this.#compileServerVars();

        const server = await import("../src/server.js");
        this.server = new server.NoBroCoteHTMLServer(relClassPath);

        const result = await this.server.run(content, relClassPath);

        let exitCode = 0;
        if (!result.errors) {
            delete result.errorMessages;
        }

        console.log("-------\nresults");
        console.log(JSON.stringify(result, null, 4));

        if (result.errors) {
            console.error(`${result.errors} ${(result.errors > 1) ? "errors" : "error"} occurred!`);
            exitCode = 1;
        } 
        if (exitCode === 0) {
            console.log("Everything seems to work fine.");
        }
        
        process.exit(exitCode);
    }


    /**
     * Helper function. Prepares the test group for 
     * the HTML page. Adjusts imports, corrects paths.
     * @returns {string[]} - Script tag content / relative class path
     */
    async #compileServerVars() {
        // import libraries
        const fs = await import("fs");
        const url = await import("url");

        // get path of script
        const instanceFilePath = url.fileURLToPath(this.fileName);

        // get path of this class
        const classFilePath = url.fileURLToPath(import.meta.url);
        const classFileName = classFilePath.split("/").at(-1);

        // get path relative to root
        const relClassPath = classFilePath.replace(this.rootDir, "");
        if (relClassPath.length === classFilePath) {
            throw new Error(`Unable to set relative import path. Is NoBroCote a subfolder of root directory '${this.rootDir}'?`);
        }
        const relInstancePath = instanceFilePath.replace(this.rootDir, "");
        if (relInstancePath.length === instanceFilePath) {
            throw new Error(`Unable to set relative import path. Is your test instance a subfolder of root directory '${this.rootDir}'?`);
        }

        // count the tree of sub folders to root
        // (minus leading slash, minus filename)
        const stepsToRoot = relInstancePath.split("/").length - 2;
        let dirDots = (stepsToRoot) ? "../".repeat(stepsToRoot).slice(0,-1) : ".";

        // get content
        let content = fs.readFileSync(instanceFilePath).toString();
        
        // replace import statement ([node] or relative [file])
        // TODO: the replacement of the relative path is most
        // likely redundant -> confirm that
        const regexpNode = new RegExp("^import.*no-bro-cote.*$", "m");
        const regexpFile = new RegExp(`^import.*${classFileName}.*$`, "m");
        const importStatement = `import { NoBroCote } from "${dirDots}${relClassPath}";`;
        content = content
            .replace(regexpNode, importStatement)
            .replace(regexpFile, importStatement);

        // find instance variable
        const varMatch = content.match(/.*(?=\s?=\s?new NoBroCote)/m);
        if (!varMatch) {
            throw new Error(`Could not find instance filename in ${relInstancePath}`);
        }

        const instanceVar = varMatch[0].trim().split(/\s/).at(-1);

        const imports = this.imports.join("\n");
        content = `\n${imports}\n${content}\nwindow.testInstance = ${instanceVar};\n`;

        return [content, relClassPath];

    }


    /**
     * Test execution. Called inside of HTML page.
     * @returns {Object} - test results 
     */
    async run() {
        const unitNames = Object.keys(this.units);
        
        const testGroup = async () => {
            
            const unitName = unitNames.shift();            
            if (unitName) {
                const header = `testing unit: '${unitName}'`; 
                console.log(`${header}:\n      ${"-".repeat(header.length + 5)}`);
                this.results.tests ++;
                const unitFN = this.units[unitName];
                await unitFN();
                await testGroup();
            }
            return true;
        };
        
        await testGroup();

        return this.results;
    }
}

export { NoBroCote };
