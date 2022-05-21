import { Test } from "../src/no-bro-cote.js";

const testError = new Test(import.meta.url);

testError.makeUnit(
    "defaultExample",
    "false",
    () => {
        document.body.textContent = "true";
        return document.body.textContent;
    }
);

testError.makeUnit(
    "unconvertTypeExample",
    "42",
    async () => {
        document.body.textContent = "42";
        return Number(document.body.textContent);
    }
);


testError.makeUnit(
    "notExample",
    "!|dog",
    () => {
        document.body.textContent = "dog";
        return document.body.textContent;
    }
);

testError.makeUnit(
    "orExample",
    "||cat|dog|bird",
    async () => {
        document.body.textContent = "fish";
        return document.body.textContent;
    }
);

testError.makeUnit(
    "exceptionExample",
    "e|TypeError",
    () => {
        console.log(False);
        return "False";
    }
);

await testError.init(false);
