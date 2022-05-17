import { createServer } from "http";
import puppeteer from "puppeteer";
import { readFile } from "fs";

class PuppeteerInstance {
    constructor() {
        this.port = 9999;
        this.tests = null;

        this.mimeTypes = {
            html: "text/html",
        };

        this.socket;

        this.server = createServer((request, response) => {
            
            const filePath = "./barebone.html";
            console.log("    + opening html test page");

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

    async run(tests) {
        this.server.listen(this.port);
        console.log(`- spinning up local http test server at "127.0.0.1:${this.port}/"`);

        console.log("- running tests:");
        const browser = await puppeteer.launch();
        await browser.createIncognitoBrowserContext({ dumpio: true });
        
        const page = await browser.newPage();
        await page.goto(`http://127.0.0.1:${this.port}/`);
        console.log("    + running test functions");
        await page.exposeFunction("tests", () => tests());
        const result = await page.evaluate(() => window.tests());
        await browser.close();
        await this.terminateServer();

        console.log("- finished tests\n- shutting down test server");
        console.log("-------\nresults");

        if (!result.errors) delete result.errorMessages;
        console.log(JSON.stringify(result, null, 4));
        if (result.errors) {
            console.error(`${result.errors} ${(result.errors > 1) ? "errors" : "error"} occurred!`);
            return 1;
        }
        console.log("Everything seems to work fine.");
        return 0;
    }
}

export { PuppeteerInstance };
