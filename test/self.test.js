import child_process from "child_process";


const callTest = async (name) => {
    let exitNode = 0;

    const successFN = child_process.exec(`node ./test/${name}.test.js`, (error, stdout, stderr) => {
        if (error) {
            exitNode = 1;
        }
        if (stderr) {
            console.log(stderr);
            exitNode = 1;
        }
        console.log(stdout);
    });

    await new Promise( (resolve) => {
        successFN.on("close", resolve);
    });

    return exitNode;
};

const successExitNode = await callTest("success");
console.log(" - done -\n");

const errorsExitNode = await callTest("errors");
console.log(" - done -\n");

const passed = ((successExitNode === 0) && (errorsExitNode === 1));

if (passed) {
    console.log(" -> passed <-");
} else {
    console.log(" -> failed <-");
}

process.exit(!passed|0);


