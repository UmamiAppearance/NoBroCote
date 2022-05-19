import { Test } from "../src/no-bro-cote.js";

const test = new Test(import.meta.url);

test.makeUnit(
    "test",
    "hello",
    () => {
        document.body.textContent = "hello";
        return document.body.textContent;
    }
);

test.makeUnit(
    "test2",
    "hello",
    async() => {
        document.body.textContent = "hello";
        return document.body.textContent;
    }
);


await test.init(test);
