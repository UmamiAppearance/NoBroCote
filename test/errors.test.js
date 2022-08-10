import { test } from "../src/index.js";

test.adjustModules = false;
test.expectFailure = true;

test.makeUnit(
    "default example",
    "false",
    () => {
        document.body.textContent = "true";
        return document.body.textContent;
    }
);

test.makeUnit(
    "no convert type example",
    "42",
    async () => {
        document.body.textContent = "42";
        return Number(document.body.textContent);
    }
);


test.makeUnit(
    "not example",
    "!|dog",
    () => {
        document.body.textContent = "dog";
        return document.body.textContent;
    }
);

test.makeUnit(
    "not - with type conversion",
    "!=|42",
    () => {
        document.body.textContent = "42";
        return Number(document.body.textContent);
    }
);

test.makeUnit(
    "or example",
    "||cat|dog|bird",
    async () => {
        document.body.textContent = "fish";
        return document.body.textContent;
    }
);

test.makeUnit(
    "exception example",
    "e|TypeError",
    () => {
        // eslint-disable-next-line no-undef
        console.log(False);
        return "False";
    }
);

test.init();
