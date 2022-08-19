import { test } from "../src/index.js";

test.adjustModules = false;

// test injection of a regular script tag
test.addScript({path: "./node_modules/wade/dist/wade.min.js"});

// test injection relative module
test.addImport("import { appendix } from './test/fixtures/testlibs/appendix.js';");

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
        document.body.textContent = "4.2";
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
