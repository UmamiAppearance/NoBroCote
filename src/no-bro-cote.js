class Test {
    constructor(fileName) {

        this.fileName = fileName;
        
        this.results = {
            tests: 0,
            errors: 0,
            errorMessages: new Object()
        };

        this.initialize = typeof window === "undefined";
        if (this.initialize) {
            this.rootDir = process.cwd();
            console.log(this.rootDir);
        }
        
        this.imports = new Array();
        this.units = new Object();
    }

    addImport(imports) {
        if (!this.initialize) {
            return;
        }

        if (typeof imports === "string") {
            this.imports.push(imports);
        } else if (Array.isArray(imports)) {
            this.imports.push(...imports);
        } else {
            throw new TypeError("Imports must be a string or an array of strings.")
        }
    }

    assert(result, expect, unit="main", input=null) {
        if (result !== expect) {
            this.makeError(input, result, expect, unit);
        }
    }

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
                this.makeError(inputStr, exception, expect, name);
            }

            if (result) this.assert(result, expect, name, inputStr);
        };
    }

    makeError(input, output, expected, unit) {
        
        this.results.errors ++;
        console.log("error", output);

        const errObj = {
            input: input,
            output: output,
            expected: expected,
            unit: unit
        };
        
        this.results.errorMessages[unit] = errObj;
    }

    async init(selfTest=false) {
        if (!this.initialize) {
            return;
        }
        let content, relClassPath;
        [content, relClassPath] = await this.compileServerVars(selfTest);

        const server = await import("../src/server.js");
        this.server = new server.HTMLPageServer(relClassPath);
        
        const exitCode = await this.server.run(content, relClassPath);
        
        process.exit(exitCode);
    }

    async compileServerVars(selfTest) {
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
        let leadingDots = (stepsToRoot) ? "../".repeat(stepsToRoot).slice(0,-1) : ".";

        // get content
        let content = fs.readFileSync(instanceFilePath).toString();
        
        // replace import statement ([node] or relative [file])
        const regexpNode = new RegExp("^import.*no-bro-cote.*$", "m");
        const regexpFile = new RegExp(`^import.*${classFileName}.*$`, "m");
        const importStatement = `import { Test } from "${leadingDots}${relClassPath}";`;
        content = content
            .replace(regexpNode, importStatement)
            .replace(regexpFile, importStatement);


        console.log(content);

        const imports = this.imports.join("\n");
        content = `\n${imports}\n${content}\nwindow.test = test;\n`;

        return [content, relClassPath];

    }

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

export { Test };
