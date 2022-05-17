import { Server } from "./runner.js";

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

    run() {
        const fn = (instance) => {
            for (const name in this.units) {
                console.log(name);
                instance.results.tests ++;
                instance.units[name]();
            }
            console.log(instance.results);
            return instance.results;
        };
        Server(fn, this);
        //fn(this);
    }
}

export { Test };
