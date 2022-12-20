/**
 * [NoBroCote]{@link https://github.com/UmamiAppearance/NoBroCote}
 *
 * @version 0.2.8
 * @author UmamiAppearance [mail@umamiappearance.eu]
 * @license GPL-3.0
 */


/**
 * Main class. Instances of this class are hybrids
 * of prototypes for creating unit tests and are
 * also working as HTM test runners.
 */
class NoBroCote {

    /**
     * Creates a new NoBroCode instance.
     * @param {string} fileName - File path of the test file. 
     * @param {boolean} [debug=false] - If true, the debug mode is active. 
     * @param {boolean} [failFast=false] - If true, the first fail will cause the whole testing to stop.
     */
    constructor(fileName, debug=false, failFast=false) {

        // name of the instance file
        this.fileName = fileName;

        this.debug = debug;
        this.failFast = failFast;

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
        this.additionalScripts = new Array();
        this.imports = new Array();
        this.units = new Object();

        // set port
        this.port = 10000;

        // set html page
        this.htmlPage = null;
    }


    /**
     * Additional scripts to be loaded into the page,
     * before testing. It requires an object which can 
     * have the following keys (as defined by Puppeteer):
     * 
     *  - url <string> URL of a script to be added.
     *  - path <string> Path to the JavaScript file to be injected into frame. If path is a relative path, then it is resolved relative to projects root directory (cwd).
     *  - content <string> Raw JavaScript content to be injected into frame.
     *  - type <string> Script type. Use 'module' in order to load a Javascript ES6 module.
     * 
     * You can also pass an array of objects.
     * 
     * @param {(Object|Object[])} script - Script object (or array of objects) as required by puppeteer
     * @see https://devdocs.io/puppeteer/#pageaddscripttagoptions
     */
    addScript(script) {
        if (!this.initialize) {
            return;
        }

        if (typeof script === "object") {
            this.additionalScripts.push(script);
        } else if (Array.isArray(script)) {
            this.additionalScripts.push(...script);
        } else {
            throw new TypeError("Imports must be an object or an array of objects.");
        }
    }


    /**
     * ES6 imports for the test runner. In contrast
     * to 'addScripts', this functions needs a valid
     * ES6 import statement. These imports are directly
     * accessible by the test units as they are part of
     * one script tag. Relative imports are resolved 
     * relative to the projects root directory (cwd).
     * Multiple imports can be passed as an array.
     * 
     * @param {(string|string[])} imports - ES6 Import statement (ore array of statements)
     */
    addImport(imports) {
        if (!this.initialize) {
            return;
        }

        if (typeof imports === "string") {
            this.imports.push(imports.replace(/(["`])/g, "'"));
        } else if (Array.isArray(imports)) {
            for (const imp of imports) {
                this.imports.push(imp.replace(/(["`])/g, "'"));
            }
        } else {
            throw new TypeError("Imports must be a string or an array of strings.");
        }
    }


    /**
     * Helper function. Compares expected and actual results.
     * Handles operators for the expect value.
     * 
     * Possible operators are:
     *     !| not
     *    !=| not, with type conversion
     *     || or, values can be separated with: valueA|valueB|valueC
     *    ==| equality, with type conversion 
     */
    #assert(result, expect, unit, input) {
        
        let passed = true;
        
        const error = () => {
            const errorMessage = "assertion failed";
            passed = false;
            this.#makeError(input, result, errorMessage, expect, unit);
        };

        if ((/^!\|/).test(String(expect))) { 
            if (result === expect.replace(/^!\|/, "")) error();
        }
        
        else if ((/^!=\|/).test(String(expect))) {
            if (result == expect.replace(/^!=\|/, "")) error();
        }
        
        else if ((/^\|\|/).test(String(expect))) {
            const valid = expect.split("|").slice(2);
            if (!valid.includes(result)) error();
        }

        else if ((/^==\|/).test(String(expect))) {
            if (result != expect.replace(/^==\|/, "")) error();
        }
        
        else if (result !== expect) {
            error();
        }

        return passed;
    }


    /**
     * Creates a test unit. A test unit takes a unit name,
     * the expected result, a standalone function and 
     * optionally arguments for that function.
     * 
     * The function has access to the html page. It acts like a
     * single function you would execute in a script tag. It has
     * access to all scripts and modules passed via 'addScript'
     * or 'addImport'.
     * 
     * The function can be asynchronous or not. It must return 
     * something which can NoBroCoteHTMLServer compared with the expected result.
     * 
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
            
            let err;
            let passed;
            let result;

            const inputStr = `Function: '${fn.name ? fn.name : "anonymous"}', Arguments: ${fnArgs.length ? fnArgs.join(", ") : "none"}`;
            
            try {
                result = await fn(...fnArgs);
            } catch (e) {
                err = e;
            }

            if (err) {

                // test if an error is expected
                const expectErr = (/^e\|/).test(String(expect));
                const errType = expectErr ? expect.replace(/^(e\|)/, "") : null;

                // test if the error is generic or in the error list
                if (expectErr &&
                    this.errorList.includes(errType) && 
                    (errType === "" || err.name === errType))
                {
                    passed = true;   
                }
                
                // if no error was expected create an error case
                else {
                    this.#makeError(
                        inputStr,
                        `${err.name} happened, while running '${name}'`,
                        err.message,
                        expect,
                        name
                    );
                    passed = false;
                }
            }

            else {
                passed = this.#assert(result, expect, name, inputStr);
            }
             
            console.log("|RESULT|", passed, name);
        };
    }


    /**
     * Helper function. Creates an error which is added
     * to the results object. 
     */
    #makeError(input, output, errorMessage, expected, unit) {
        
        this.results.errors ++;
        const errObj = {
            input,
            output,
            errorMessage,
            expected,
            unit
        };

        console.log("|ERROR|", JSON.stringify(errObj, null, 4));
        
        this.results.errorMessages[unit] = errObj;
    }


    /**
     * The final thing to do, when creating a test
     * group is calling this init function to make
     * it work. It collects and compiles everything
     * and starts the actual test. 
     */
    async init() {
        if (!this.initialize) {
            return;
        }

        const { bold, red } = await import("colorette");
        const { content, group } = await this.#compileServerVars();

        const server = await import("../src/server.js");
        this.server = new server.NoBroCoteHTMLServer(
            this.port,
            this.htmlPage,
            group,
            this.debug,
            this.expectFailure,
            this.failFast
        );

        let result;
        if (this.failFast) {
            try {
                result = await this.server.run(content, this.additionalScripts);
            } catch {
                process.exit(2);
            }
        } else {
            result = await this.server.run(content, this.additionalScripts);
        }

        let exitCode = 0;
        if (!result.errors) {
            delete result.errorMessages;
        }

        const preLog = () => [
            "    •",
            group,
            ">"
        ];

        const logResult = (result) => {
            console.log(
                ...preLog(),
                bold(`results\n${JSON.stringify(result, null, 4)}`)
            );
        };

        const logError = (...args) => {
            console.log(...[...preLog(), ...args].map(arg => bold(red(arg))));
        };

        if (this.debug) {
            logResult(result);
        }

        if (result.errors && !this.expectFailure) {
            logResult(result);
            logError(
                red(`${result.errors} ${(result.errors > 1) ? "errors" : "error"} occurred!`)
            );
            exitCode = 1;
        } else if (!result.errors && this.expectFailure) {
            logError(
                red("Failures were expected, but no errors were thrown.")
            );
            exitCode = 1;
        }
        
        process.exit(exitCode);
    }


    /**
     * Helper function. Prepares the test group for 
     * the HTML page. Adjusts imports, corrects paths.
     * @returns {string[]} - [Script tag content, relative class path]
     */
    async #compileServerVars() {
        
        // import libraries
        const { access, readFileSync, F_OK } = await import("fs");
        const { join, sep } = await import("path");
        const { fileURLToPath } = await import("url");
        const { ImportManager } = await import("import-manager");
        const { default: urlExist }  = await import("url-exist");

        const group = this.fileName
            .split(sep).at(-1)
            .replace(/\.[^/.]+$/, "")
            .replace(/test-/, "")
            .replace(/\.test/, "");

        // test if top level
        const topLevel = /^file/.test(this.fileName);

        // get path of script
        const instanceFilePath = topLevel ? fileURLToPath(this.fileName) : this.fileName;

        // get path of this class
        let classFilePath = fileURLToPath(import.meta.url);
        
        if (!topLevel) {
            classFilePath = classFilePath.replace("no-bro-cote.js", "index.js");
        }
        const classFileName = classFilePath.split(sep).at(-1);

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
        const stepsToRoot = relInstancePath.split(sep).length - 2;
        let dirDots = (stepsToRoot) ? "../".repeat(stepsToRoot).slice(0,-1) : ".";

        // get content
        let content = readFileSync(instanceFilePath).toString();
        
        // adjust import statements to relative local statements
        if (this.adjustModules !== false) {
            const importManager = new ImportManager(content, classFilePath);
            const statement = importManager.selectModByName("no-bro-cote");
            statement.methods.renameModule(`${dirDots}${relClassPath}`, "string");
            importManager.commitChanges(statement);
            content = importManager.code.toString();
        }
            
        // find instance variable
        let instanceVar;
        if (topLevel) {
            const varMatch = content.match(/.*(?=\s?=\s?new NoBroCote)/m);
            if (!varMatch) {
                throw new Error(`Could not find instance filename in ${relInstancePath}`);
            }
            instanceVar = varMatch[0].trim().split(/\s/).at(-1);
        } else {
            instanceVar = "test";
        }

        // test import paths
        for (const statement of this.imports) {
            // eslint-disable-next-line quotes
            const pathMatch = statement.split("'");
            if (pathMatch.length < 2) {
                throw new Error(`Cannot find a path in import statement '${statement}'`);
            }
            const destination = pathMatch[1];

            // handle urls
            if ((/^(?:http(s)?:\/\/)/).test(destination)) {

                if (!(await urlExist(destination))) {
                    throw new Error(`URL '${destination}' cannot be resolved`);
                }
            }

            // handle relative imports
            else {
                const importPath = join(this.rootDir, destination);
                
                access(importPath, F_OK, (err) => {
                    if (err) {
                        throw new Error(`Cannot resolve path '${importPath}'`);
                    }
                });
            }
        }

        const imports = this.imports.join("\n");
        content = `\n${imports}\n${content}\nwindow.testInstance = ${instanceVar};\n`;

        if (!this.htmlPage) {
            this.htmlPage = "." + relClassPath.replace(classFileName, "barebone.html");
        }

        return { content, group };
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

export default NoBroCote;
