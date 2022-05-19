import { Test } from "../src/no-bro-cote.js";

const test = new Test(import.meta.url);

test.makeUnit(
    "successfulTestExample",
    "true",
    () => {
        console.log("msg from test");
        document.body.textContent = "true";
        return document.body.textContent;
    }
);

test.makeUnit(
    "failedTestExample",
    "false",
    async () => {
        document.body.textContent = "true";
        return document.body.textContent;
    }
);

test.makeUnit(
    "exceptionExample",
    "False",
    () => {
        console.log(False);
        return "False";
    }
);

await test.init();
