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

    async init() {
        if (!this.initialize) {
            return;
        }
        const server = await import("../src/server.js");
        this.puppeteerInstance = new server.PuppeteerInstance();
    }

    async getCallerContent() {
        // import libraries
        const url = await import("url"); 
        const fs = await import("fs");

        // get path of script
        const filePath = url.fileURLToPath(this.fileName);

        // get content
        let content = fs.readFileSync(filePath).toString();
        
        content = content
            .replace("../src/no-bro-cote.js", "./src/no-bro-cote.js")
            .replace("await test.run();", "window.test = test");

        return content;

    }

    async run() {
        if (this.initialize) {

            const content = await this.getCallerContent();
            
            const exitCode = await this.puppeteerInstance.run(content);
            process.exit(exitCode);
        }
        
        else {

            for (const name in this.units) {
                console.log(`testing unit ${name}`);
                this.results.tests ++;
                this.units[name]();
            }

            console.log(this.results);
            return this.results;
        }
    }
}

export { Test };
