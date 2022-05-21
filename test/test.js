import { Test } from "../src/no-bro-cote.js";

const test = new Test(import.meta.url);

test.addImport("import { CodeJar } from 'https://medv.io/codejar/codejar.js';");

test.makeUnit(
    "successfulTestExample",
    "true",
    () => {
        document.body.textContent = "true";
        return document.body.textContent;
    }
);

test.makeUnit(
    "failedTestExample",
    "!|dog",
    async () => {
        document.body.textContent = "cat";
        return document.body.textContent;
    }
);

test.makeUnit(
    "exceptionExample",
    "e|ReferenceError",
    () => {
        console.log(False);
        return "False";
    }
);

await test.init();
