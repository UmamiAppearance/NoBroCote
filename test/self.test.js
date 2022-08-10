import child_process from "child_process";

const callTest = async (name) => {
    let exitNode = 0;

    const successFN = child_process.exec(`node --no-deprecation ./test/_${name}.test.js`, (error, stdout, stderr) => {
        if (error) {
            exitNode = 1;
        }
        console.log(stdout);
        console.log(stderr);
    });

    await new Promise((resolve) => {
        successFN.on("close", resolve);
    });

    return exitNode;
};

console.log("\nTest Group [1/2] - (test success):");
const successExitNode = await callTest("success");
console.log("______\n[done]");

console.log("\nTest Group [2/2] - (test errors):");
const errorsExitNode = await callTest("errors");
console.log("______\n[done]");

const passed = ((successExitNode === 0) && (errorsExitNode === 1));

if (passed) {
    console.log("------> Passed");
} else {
    console.error("------> Failed");
}

process.exit(!passed|0);


