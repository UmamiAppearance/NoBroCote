import { test } from "../src/index.js";

test.adjustModules = false;

test.makeUnit(
    "defaultExample",
    "false",
    () => {
        document.body.textContent = "true";
        return document.body.textContent;
    }
);

test.makeUnit(
    "noConvertTypeExample",
    "42",
    async () => {
        document.body.textContent = "42";
        return Number(document.body.textContent);
    }
);


test.makeUnit(
    "notExample",
    "!|dog",
    () => {
        document.body.textContent = "dog";
        return document.body.textContent;
    }
);

test.makeUnit(
    "notWithTypeConversionExample",
    "!=|42",
    () => {
        document.body.textContent = "42";
        return Number(document.body.textContent);
    }
);

test.makeUnit(
    "orExample",
    "||cat|dog|bird",
    async () => {
        document.body.textContent = "fish";
        return document.body.textContent;
    }
);

test.makeUnit(
    "exceptionExample",
    "e|TypeError",
    () => {
        // eslint-disable-next-line no-undef
        console.log(False);
        return "False";
    }
);

test.init();
