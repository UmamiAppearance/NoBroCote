import { Test } from "../src/no-bro-cote.js";

const test = new Test(import.meta.url);

test.makeUnit(
    "test",
    "hello",
    () => "hello"
);

await test.init();

await test.run();