import puppeteer from "puppeteer";

class Test {
    constructor() {
        
        this.results = {
            tests: 0,
            errors: 0,
            errorMessages: new Object()
        };

        this.units = new Object();
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

        this.units[name] = () => {
            let result;
            const inputStr = `${fn.name} -> ( ${fnArgs.join(", ")} )`;
            
            try {
                result = fn(...fnArgs);
            } catch(err) {
                this.makeError(inputStr, err.message, expect, name);
            }

            this.assert(result, expect, name, inputStr);
        };
    }

    makeError(input, output, expected, unit) {
        
        this.results.errors ++;

        const errObj = {
            input: input,
            output: output,
            expected: expected,
            unit: unit
        };
        
        this.results.errorMessages[unit] = errObj;
    }

    async puppeteerInstance(tests) {
        console.log("- running tests:");
        const browser = await puppeteer.launch();
        await browser.createIncognitoBrowserContext({ dumpio: true });
        
        const page = await browser.newPage();
        page.setContent("<!DOCTYPE html><html><body></body></html>");
        console.log("    + running test functions");
        await page.exposeFunction("tests", () => tests());
        const result = await page.evaluate(() => window.tests());
        await browser.close();

        console.log("- finished tests\n- shutting down test server");
        console.log("-------\nresults");

        if (!result.errors) delete result.errorMessages;
        console.log(JSON.stringify(result, null, 4));
        if (result.errors) {
            console.error(`${result.errors} ${(result.errors > 1) ? "errors" : "error"} occurred!`);
            return 1;
        }
        console.log("Everything seems to work fine.");
        return 0;
    }

    async run(exitProcess=true) {

        const tests = () => {
            for (const name in this.units) {
                this.results.tests ++;
                this.units[name]();
            }

            return this.results;
        };

        const exitCode = await this.puppeteerInstance(tests);
        
        if (exitProcess) {
            process.exit(exitCode);
        }

        return exitCode;
    }
}

export { Test };
