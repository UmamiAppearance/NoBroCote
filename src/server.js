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
import { green, red } from "colorette";

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
                if (this.debug) console.log("  + opening html test page");
            } else {
                if (this.debug) console.log(`  + importing ${request.url.split("/").at(-1)}`);
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


    /**
     * Test Runner. Called after everything is initialized.
     * @param {string} script - Content of main script as string
     * @param {Object[]} additionalScripts - Array of puppeteer 
     * @returns 
     */
    async run(script, additionalScripts) {
        
        if (this.debug) console.log("- spinning up local http test server");
        this.server.listen(this.port);

        if (this.debug) console.log("- running tests:");
        const browser = await puppeteer.launch();
        await browser.createIncognitoBrowserContext();
        
        const page = await browser.newPage();

        // set timeout to 3000 ms (which is plenty of time for a local server)
        page.setDefaultNavigationTimeout(3000);
    
        page.on("console", async msg => {

            let isHeader = false;

            const argJoinFN = async () => {
                let msgArray = [];

                msg.args().forEach(async (arg, i) => {

                    let val;
                    try {
                        val = await arg.jsonValue();
                    } catch {
                        val = "__unset__";
                    }

                    if (val !== "__unset__") {
                        if (i === 0 && val === "|HEAD|") {
                            isHeader = true;
                        } else {
                            msgArray.push(val);
                        }
                    }
                });

                return msgArray;
            };
            
            const logList = await argJoinFN();

            if (logList) {
                if (isHeader) {
                    const symbol = logList[0] ? green("✔") : red("✖");
                    console.log(
                        "   ",
                        symbol,
                        this.group,
                        "->",
                        logList.slice(1).join(" ")
                    );
                } else {
                    console.log(this.group + " log: " + logList.join(" "));
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
        
        if (this.debug) console.log("  + appending test group");
        await page.addScriptTag({type: "module", content: script});

        // wait for test instance to be read
        await page.waitForFunction("typeof window.testInstance !== 'undefined'");

        if (this.debug) console.log("  + running test functions");
        const result = await page.evaluate(async () => await window.testInstance.run());
        
        await browser.close();
        await this.terminateServer();

        if (this.debug) console.log("- all done\n- shutting down test server");
        
        return result;
    }
}

export { NoBroCoteHTMLServer };
