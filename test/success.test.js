import { NoBroCote } from "../src/no-bro-cote.js";

const testSuccess = new NoBroCote(import.meta.url);

testSuccess.makeUnit(
    "defaultExample",
    "true",
    () => {
        document.body.textContent = "true";
        return document.body.textContent;
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
        console.log(False);
        return "False";
    }
);


await testSuccess.init(false);
