class Test {
    constructor(fileName) {

        this.fileName = fileName;
        
        this.results = {
            tests: 0,
            errors: 0,
            errorMessages: new Object()
        };

        this.units = new Object();

        this.initialize = typeof window === "undefined";
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

    async init(instance, selfTest=false) {
        this.instance = instance;

        if (!this.initialize) {
            return;
        }
        
        const server = await import("../src/server.js");
        this.server = new server.HTMLPageServer();
        
        const content = await this.getCallerContent(selfTest);
            
        const exitCode = await this.server.run(content);
        
        process.exit(exitCode);
    }

    async getCallerContent(selfTest) {
        // import libraries
        const fs = await import("fs");
        const url = await import("url"); 
        const path = await import("path");

        // get path of script
        const filePath = url.fileURLToPath(this.fileName);

        // get server root
        const classPath = url.fileURLToPath(import.meta.url);
        const serverRoot = path.dirname(classPath);

        console.log(classPath);
        console.log(serverRoot);


        // get content
        let content = fs.readFileSync(filePath).toString();
        
        if (selfTest) {
            content = content.replace("../src/no-bro-cote.js", "./src/no-bro-cote.js");
        }
        content += "\nwindow.test = test;";

        return content;

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
