import { Test } from "../src/no-bro-cote.js";

const testSuccess = new Test(import.meta.url);

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


const main = async () => {

    let passedSuccess = false;
    console.log("::: Testing Successful Tests :::");
    const successResult = await testSuccess.init(this, false);
    if (!successResult.errors) {
        passedSuccess = true;
        console.log("::: Passed :::\n");
    } else {
        console.log("::: Failed :::\n");
    }

    let passedErrors = false;
    console.log("::: Testing Test Errors :::");    
    const errorResult = await testError.init(this, false);
    if (!errorResult.errors === errorResult.tests) {
        console.log("::: Passed :::\n");
        passedErrors = true;
    } else {
        console.log("::: Failed :::\n");
    }

    return (passedSuccess && passedErrors);
};

process.exit(!(await main()));
