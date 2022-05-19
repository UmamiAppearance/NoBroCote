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
        if (this.initialize) {
            return;
        }
        
        if (name in this.units) {
            throw new Error(`Unit ${name} already exists.`);
        }

        this.units[name] = () => {
            let result;
            const inputStr = `${fn.name} -> ( ${fnArgs.join(", ")} )`;
            
            try {
                result = fn(...fnArgs);
            } catch(err) {
                console.log("err", err);
                this.makeError(inputStr, err.message, expect, name);
            }

            this.assert(result, expect, name, inputStr);
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

    async init(instance) {
        this.instance = instance;

        if (!this.initialize) {
            return;
        }
        
        const server = await import("../src/server.js");
        this.server = new server.HTMLPageServer();
        
        const content = await this.getCallerContent();
            
        const exitCode = await this.server.run(content);
        
        process.exit(exitCode);
    }

    async getCallerContent() {
        // import libraries
        const url = await import("url"); 
        const fs = await import("fs");

        // get path of script
        const filePath = url.fileURLToPath(this.fileName);

        // get content
        let content = fs.readFileSync(filePath).toString();
        
        content = content.replace("../src/no-bro-cote.js", "./src/no-bro-cote.js");
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
