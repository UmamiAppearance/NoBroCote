import { NoBroCote } from "../src/no-bro-cote.js";

const testSuccess = new NoBroCote(import.meta.url);

// test injection of a regular script tag
testSuccess.addScript({path: "./test/testlibs/wade.min.js"});

// test injection relative module
testSuccess.addImport("import { appendix } from './test/testlibs/rel-mod.js';");

testSuccess.makeUnit(
    "defaultExample",
    "true",
    () => {
        document.body.textContent = "true";
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
    "orExample",
    "||cat|dog|bird",
    async () => {
        document.body.textContent = "dog";
        return document.body.textContent;
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
