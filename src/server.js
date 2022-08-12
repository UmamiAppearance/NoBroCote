/*
 * [NoBroCote|HTML Server]{@link https://github.com/UmamiAppearance/NoBroCote}
 *
 * @version 0.2.0
 * @author UmamiAppearance [mail@umamiappearance.eu]
 * @license GPL-3.0
 */

import { createServer } from "http";
import puppeteer from "puppeteer";
import { readFile } from "fs";
import { bold, blue, gray, green, red } from "colorette";

/**
 * HTML Test runner. It contains a http test
 * server and uses puppeteer to run javascript
 * for the browser.
 */
class NoBroCoteHTMLServer {

    /**
     * Creates the puppeteer instance. The path of
     * NoBroCote main class must be passed to it.
     * @param {number} port - Port 
     */
    constructor(port, htmlFile, group, debug) {
        this.port = port;
        this.group = group;
        this.debug = debug;
        this.tests = null;

        // http server
        this.mimeTypes = {
            html: "text/html",
            htm:  "text/html",
            jpeg: "image/jpeg",
            jpg:  "image/jpeg",
            png:  "image/png",
            svg:  "image/svg+xml",
            json: "application/json",
            js:   "text/javascript",
            mjs:  "text/javascript",
            css:  "text/css"
        };

        this.socket;

        this.server = createServer((request, response) => {
            
            let filePath;
            if (request.url === "/") {
                filePath = htmlFile;
                if (this.debug) this.debugLog(1, "+", ["opening html test page"]);
            } else {
                if (this.debug) this.debugLog(1, "+", ["importing", request.url.split("/").at(-1)]);
                filePath = `.${request.url}`;
            }

            const contentType = this.mimeTypes[filePath.split(".").at(-1)];


            readFile(filePath, (error, content) => {
                if (error) {
                    console.error(red(error));
                    return 1;
                }
                response.writeHead(200, { "Content-Type": contentType });
                response.end(content, "utf-8");
                return 0;
            });

        });

        this.server.on("connection", (sock) => {
            this.socket = sock;
            this.server.once("close", () => {
                this.socket = null;
            });
        });

        this.server.on("error", e => {
            if (e.code === "EADDRINUSE") {
                this.port ++;
                this.server.listen(this.port);
            } else {
                throw e;
            }
        });

        this.terminateServer = async () => {
            if (this.socket) this.socket.destroy();
            this.server.close();
        };

    }

    debugLog(indent, sign, args) {
        const msg = [
            sign,
            "(" + this.group + ")",
            ...args
        ];
        
        if (indent) {
            msg.unshift(" ".repeat(indent));
        }
            
        console.log(...msg.map(arg => gray(arg)));
    }


    /**
     * Test Runner. Called after everything is initialized.
     * @param {string} script - Content of main script as string
     * @param {Object[]} additionalScripts - Array of puppeteer 
     * @returns 
     */
    async run(script, additionalScripts) {
        
        if (this.debug) this.debugLog(0, "-", ["spinning up local http test server"]);
        this.server.listen(this.port);

        if (this.debug) this.debugLog(0, "-", ["running tests:"]);
        const browser = await puppeteer.launch();
        await browser.createIncognitoBrowserContext();
        
        const page = await browser.newPage();

        // set timeout to 3000 ms (which is plenty of time for a local server)
        page.setDefaultNavigationTimeout(3000);
    
        page.on("console", async msg => {

            let isInternal = false;

            const argJoinFN = async () => {
                let msgArray = [];
                
                msg.args().forEach(async (arg, i) => {

                    let val;
                    const { preview, type, subtype } = arg._remoteObject;
                    //console.error(preview);
                    if (preview) {
                        val = await unpackValues(preview, subtype);
                        msgArray.push(val);
                    }
                    
                    else {

                        if (type === "function") {
                            val = arg._remoteObject;
                        }
                        
                        else {
                            try {
                                val = await arg.jsonValue();
                            } catch {
                                val = "n/a -> value could not be unpacked for logging";
                            }
                        }

                        if (i === 0 && val === "|RESULT|") {
                            isInternal = true;
                        } else {
                            msgArray.push(val);
                        }
                    }
                });

                return msgArray;
            };
            
            const logList = await argJoinFN();

            if (logList) {
                if (isInternal) {
                    const symbol = logList[0] ? green("✔") : red("✖");
                    console.log(
                        "   ",
                        symbol,
                        this.group,
                        ">",
                        ...logList.slice(1)
                    );
                } else {
                    const iLen = 4;
                    const indent = " ".repeat(iLen);
                    const info = indent + "(" + this.group + ") log:";
                    const separator = gray(`\n${indent}${"-".repeat(info.length - iLen - 1)}\n`);
                    const msg = [
                        bold(blue(info)),
                        separator,
                        ...logList,
                        "\n"
                    ];
                    console.log(...msg);
                }
            }
        });

        page.on("pageerror", ({ message }) => {
            console.error(red(`    > PAGE_ERROR:\n---\n${message}\n`));
        });

        // open html test page (htmlFile @constructor)
        await page.goto(`http://127.0.0.1:${this.port}/`);

        // add additional scripts
        for (const scriptObj of additionalScripts) {
            await page.addScriptTag(scriptObj);
        }
        
        if (this.debug) this.debugLog(1, "+", ["appending test group"]);
        await page.addScriptTag({type: "module", content: script});

        // wait for test instance to be read
        await page.waitForFunction("typeof window.testInstance !== 'undefined'");

        if (this.debug) this.debugLog(1, "+", ["running test functions"]);

        const result = await page.evaluate(async () => await window.testInstance.run());
        
        if (this.debug) this.debugLog(0, "-", ["shutting down test server"]);
        await browser.close();
        await this.terminateServer();

        if (this.debug) this.debugLog(0, "-", ["all done"]);
        
        return result;
    }
}



const getType = elem => {
    
    let val;
    
    if (elem.type === "number") {
        val = Number(elem.value);
    }
    
    else if (elem.type === "boolean") {
        val = elem.value === "true";
    }
    
    else if (elem.type === "undefined") {
        val = undefined;
    }
    
    else {
        console.log("ELEM", elem);
        if (elem.type === "accessor") {
            val = "<accessor>";
        } else if (elem.type === "function") {
            val = "<function>";
        } else if (elem.type === "bigint") {
            val = BigInt(elem.value.slice(0, -1));
        } else if (elem.value === "null") {
            val = null;
        } else {
            val = elem.value;
        }
    }

    return val;
};

const unpackValues = async (preview, subtype) => {
    console.error(subtype);
    let val; 
    
    if (subtype === "array") {
        val = [];
        for (const elem of preview.properties) {
            console.error("ELEM", elem);
            val.push(getType(elem));
        }
    }
    
    else if (subtype === "typedarray") {
        let type;
        const preArray = [];
        
        console.error(preview);
        for (const elem of preview.properties) {
            
            // test if name is an index key
            if (!isNaN(elem.name)) {
                if (elem.type === "bigint") {
                    preArray.push(elem.value.slice(0, -1));
                } else {
                    preArray.push(elem.value);
                }
            }

            else if (elem.name === "Symbol(Symbol.toStringTag)") {
                type = elem.value;
            }

        }
        console.error(preArray);
        val = global[type].from(preArray);
    }

    else if (typeof subtype === "undefined") {
        val = {};
        for (const elem of preview.properties) {
            val[elem.name] = getType(elem);
        }
    }

    return val;
};

export { NoBroCoteHTMLServer };
