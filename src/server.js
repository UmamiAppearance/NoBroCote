/*
 * [NoBroCote|HTML Server]{@link https://github.com/UmamiAppearance/NoBroCote}
 *
 * @version 0.1.2
 * @author UmamiAppearance [mail@umamiappearance.eu]
 * @license GPL-3.0
 */

import { createServer } from "http";
import puppeteer from "puppeteer";
import { readFile } from "fs";

/**
 * HTML Test runner. It contains a http test
 * server and uses puppeteer to run javascript
 * for the browser.
 */
class NoBroCoteHTMLServer {

    /**
     * Creates the puppeteer instance. The path of
     * NoBroCote main class must be passed to it.
     * @param {string} relClassPath - Path of NoBoCote Class 
     */
    constructor(relClassPath) {
        this.port = 9999;
        this.tests = null;
        this.relClassPath = relClassPath;

        // http server
        this.mimeTypes = {
            html: "text/html",
            js: "text/javascript"
        };

        this.socket;

        this.server = createServer((request, response) => {
            
            let filePath;
            if (request.url === "/") {
                filePath = `.${this.relClassPath}`;
                console.log("  + opening html test page");
            } else {
                console.log(`  + importing ${request.url.split("/")[2]}`);
                filePath = `.${request.url}`;
            }

            const contentType = this.mimeTypes[filePath.split(".").pop()];


            readFile(filePath, (error, content) => {
                if (error) {
                    console.error(error);
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
        this.server.listen(this.port);
        console.log(`- spinning up local http test server at "127.0.0.1:${this.port}/"`);

        console.log("- running tests:");
        const browser = await puppeteer.launch();
        await browser.createIncognitoBrowserContext();
        
        const page = await browser.newPage();
    
        page.on("console", async msg => {
            const argJoinFN = async () => {
                const msgArray = [];
                msg._args.forEach(async (arg) => msgArray.push(`${await arg.jsonValue()}`));
                return msgArray;
            };

            console.log("    > log: " + (await argJoinFN()).join(" "));
        });

        await page.goto(`http://127.0.0.1:${this.port}/`);

        console.log("  + preparing empty page body");
        await page.evaluate(() => document.body.innerHTML = "");

        // add additional scripts
        for (const scriptObj of additionalScripts) {
            await page.addScriptTag(scriptObj);
        }
        
        console.log("  + appending test group");
        await page.addScriptTag({type: "module", content: script});
        
        // wait for test instance to be ready
        await page.waitForFunction("typeof window.testInstance !== 'undefined'");

        console.log("  + running test functions");
        const result = await page.evaluate(async () => await window.testInstance.run());
        
        await browser.close();
        await this.terminateServer();

        console.log("- all done\n- shutting down test server");
        
        return result;
    }
}

export { NoBroCoteHTMLServer };
