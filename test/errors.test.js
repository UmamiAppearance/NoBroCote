import NoBroCote from "../src/no-bro-cote.js";

const testErrors = new NoBroCote(import.meta.url);

testErrors.makeUnit(
    "defaultExample",
    "false",
    () => {
        document.body.textContent = "true";
        return document.body.textContent;
    }
);

testErrors.makeUnit(
    "noConvertTypeExample",
    "42",
    async () => {
        document.body.textContent = "42";
        return Number(document.body.textContent);
    }
);


testErrors.makeUnit(
    "notExample",
    "!|dog",
    () => {
        document.body.textContent = "dog";
        return document.body.textContent;
    }
);

testErrors.makeUnit(
    "notWithTypeConversionExample",
    "!=|42",
    () => {
        document.body.textContent = "42";
        return Number(document.body.textContent);
    }
);

testErrors.makeUnit(
    "orExample",
    "||cat|dog|bird",
    async () => {
        document.body.textContent = "fish";
        return document.body.textContent;
    }
);

testErrors.makeUnit(
    "exceptionExample",
    "e|TypeError",
    () => {
        // eslint-disable-next-line no-undef
        console.log(False);
        return "False";
    }
);

await testErrors.init(false);
