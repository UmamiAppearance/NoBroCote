import NoBroCote from "../src/no-bro-cote.js";

const testSuccess = new NoBroCote(import.meta.url);

// test injection of a regular script tag
testSuccess.addScript({path: "./node_modules/wade/dist/wade.min.js"});

// test injection relative module
testSuccess.addImport("import { appendix } from './test/testlibs/appendix.js';");

testSuccess.makeUnit(
    "defaultExample",
    "true",
    () => {
        document.body.textContent = "true";
        return document.body.textContent;
    }
);

testSuccess.makeUnit(
    "orTest",
    "||cat|dog|bird",
    () => {
        const pickPet = () => ["cat", "dog", "bird"].at(Math.floor(Math.random()*3));
        document.body.textContent = pickPet();
        return document.body.textContent;
    }
);

testSuccess.makeUnit(
    "useRegularScript",
    1,
    () => {
        // eslint-disable-next-line no-undef
        const search = Wade(["Apple", "Lemon", "Orange", "Tomato"]);
        const searchResults = search("Lem");
        return searchResults[0].index;
    }
);


testSuccess.makeUnit(
    "testRelativeImport",
    "wow",
    async () => {
        // eslint-disable-next-line no-undef
        await appendix("wow");
        return document.querySelector("#wow").textContent;
    }
);


testSuccess.makeUnit(
    "convertTypeExample",
    "==|42",
    async () => {
        document.body.textContent = "42";
        return Number(document.body.textContent);
    }
);


testSuccess.makeUnit(
    "notExample",
    "!|dog",
    () => {
        document.body.textContent = "cat";
        return document.body.textContent;
    }
);

testSuccess.makeUnit(
    "notWithTypeConversionExample",
    "!=|42",
    () => {
        document.body.textContent = "4.2";
        return Number(document.body.textContent);
    }
);

testSuccess.makeUnit(
    "orExample",
    "||cat|dog|bird",
    async () => {
        document.body.textContent = "dog";
        return document.body.textContent;
    }
);

testSuccess.makeUnit(
    "expectErrorTest",
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
testSuccess.errorList.push(ValidationError.name);
testSuccess.makeUnit(
    "customError",
    "e|ValidationError",
    () => {
        throw new ValidationError("Invalid!");
    }
);

testSuccess.makeUnit(
    "exceptionExample",
    "e|ReferenceError",
    () => {
        // eslint-disable-next-line no-undef
        console.log(False);
        return "False";
    }
);


await testSuccess.init(false);
