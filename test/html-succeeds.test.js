import { test } from "../src/index.js";

test.adjustModules = false;
test.htmlPage = "./test/fixtures/working.html";

test.makeUnit(
    "test existing script on html page",
    "works",
    () => {
        const testDiv = document.querySelector("#test");
        return testDiv.innerHTML;
    }
);

test.init();
