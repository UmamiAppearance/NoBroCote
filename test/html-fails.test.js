import { test } from "../src/index.js";

test.adjustModules = false;
test.expectFailure = true;
test.htmlPage = "./test/fixtures/failing.html";

test.makeUnit(
    "test page failure",
    "error",
    () => {
        const testDiv = document.querySelector("#test");
        return testDiv.innerHTML;
    }
);

test.init();
