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
import unpackValues from "./utils.js";

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
    constructor(port, htmlFile, group, debug, ignoreErrors, failFast) {
        this.port = port;
        this.group = group;
        this.debug = debug;
        this.ignoreErrors = Boolean(ignoreErrors);
        this.failFast = failFast;
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

        //this.onConsole = this.onConsole.bind(this);

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

    async onConsole(msg) {

        let isInternal = false;
        let isError = false;

        const argJoinFN = async () => {
            let msgArray = [];
            
            msg.args().forEach(async (arg, i) => {

                let val;
                const { preview, type, subtype } = arg._remoteObject;
                
                if (preview) {
                    val = await unpackValues(preview, subtype);
                    msgArray.push(val);
                }
                
                else {

                    if (type === "function") {
                        val = arg._remoteObject;
                    }

                    else if (type === "symbol") {
                        val = arg._remoteObject.description;
                    }
                    
                    else {
                        try {
                            val = await arg.jsonValue();
                        } catch {
                            val = "n/a (value could not be unpacked for logging)";
                        }
                    }

                    if (i === 0 && val === "|RESULT|") {
                        isInternal = true;
                    } else if (i === 0 && val === "|ERROR|") {
                        isError = true;
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
                const exitCase = this.failFast && !this.ignoreErrors && logList[0] === false;
                const symbol = logList[0] ? green("✔") : red("✖");
                if (exitCase) {
                    logList.push(red("†††"));
                }

                console.log(
                    "   ",
                    symbol,
                    this.group,
                    ">",
                    ...logList.slice(1)
                );
                
                if (exitCase) {
                    process.exit(2);
                }
            } else if (isError) {
                if (this.failFast && !this.ignoreErrors) {
                    console.log(bold(red("\nERROR")), red(logList.at(0)));
                }
            } else {
                const iLen = 5;
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
    }

    async onPageError(msgObj) {
        const { message } = msgObj;
        if (!this.ignoreErrors) {
            const iLen = 5;
            const indent = " ".repeat(iLen);
            const info = indent + "(" + this.group + ") page error:";
            const separator = red(`\n${indent}${"-".repeat(info.length - iLen - 1)}\n`);
            const msg = [
                bold(red(info)),
                separator,
                red(message),
                "\n"
            ];
            console.error(...msg);
        }
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
    
        page.on("console", this.onConsole.bind(this));

        page.on("pageerror", this.onPageError.bind(this));

        // open html test page (htmlFile @constructor)
        await page.goto(`http://127.0.0.1:${this.port}/`);

        // add additional scripts
        for (const scriptObj of additionalScripts) {
            await page.addScriptTag(scriptObj);
        }
        
        if (this.debug) this.debugLog(1, "+", ["appending test group"]);
        await page.addScriptTag({type: "module", content: script});

        // wait for test instance to be ready
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

export { NoBroCoteHTMLServer };
