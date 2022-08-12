import { test } from "../src/index.js";

test.adjustModules = false;

// test injection of a regular script tag
test.addScript({path: "./node_modules/wade/dist/wade.min.js"});

// test injection relative module
test.addImport("import { appendix } from './test/fixtures/testlibs/appendix.js';");

class tt {
    //
}

test.makeUnit(
    "default example",
    "true",
    () => {
        document.body.textContent = "true";
        return document.body.textContent;
    }
);

test.makeUnit(
    "or test",
    "||cat|dog|bird",
    () => {
        const pickPet = () => ["cat", "dog", "bird"].at(Math.floor(Math.random()*3));
        document.body.textContent = pickPet();
        return document.body.textContent;
    }
);

test.makeUnit(
    "regular script tag",
    1,
    () => {
        // eslint-disable-next-line no-undef
        const search = Wade(["Apple", "Lemon", "Orange", "Tomato"]);
        const searchResults = search("Lem");
        return searchResults[0].index;
    }
);


test.makeUnit(
    "relative import",
    "wow",
    async () => {
        // eslint-disable-next-line no-undef
        await appendix("wow");
        return document.querySelector("#wow").textContent;
    }
);


test.makeUnit(
    "convert type example",
    "==|42",
    async () => {
        document.body.textContent = "42";
        return Number(document.body.textContent);
    }
);


test.makeUnit(
    "not example",
    "!|dog",
    () => {
        document.body.textContent = "cat";
        return document.body.textContent;
    }
);

test.makeUnit(
    "not - with type conversion",
    "!=|42",
    () => {
        const x=()=>1;
        document.body.textContent = "4.2";
        console.log("blue", [1,2, true, null, undefined, "white", [true, false], new Uint16Array([1,2])], 12, new Uint16Array([12, 233]));
        console.log({
            a:1,
            b:2,
            log: ["a", "b", "c"],
            get latest() {
                return this.log[this.log.length - 1];
            },
            set yes(v) {
                this.log.push(v);
            },
            bb: () => 1
        });
        console.log(x);
        console.log(tt);
        console.log(new BigInt64Array([24n]));
        return Number(document.body.textContent);
    }
);


test.makeUnit(
    "expect error",
    "e|TypeError",
    () => {
        throw new TypeError("I am glad this error was raised!");
    }
);

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
test.errorList.push(ValidationError.name);
test.makeUnit(
    "custom error",
    "e|ValidationError",
    () => {
        throw new ValidationError("Invalid!");
    }
);

test.makeUnit(
    "exception example",
    "e|ReferenceError",
    () => {
        // eslint-disable-next-line no-undef
        console.log(False);
        return "False";
    }
);


test.init();
