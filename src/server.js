import { createServer } from "http";
import puppeteer from "puppeteer";
import { readFile } from "fs";

class HTMLPageServer {
    constructor() {
        this.port = 9999;
        this.tests = null;

        this.mimeTypes = {
            html: "text/html",
            js: "text/javascript"
        };

        this.socket;

        this.server = createServer((request, response) => {
            
            let filePath;
            if (request.url === "/") {
                filePath = "./src/barebone.html";
                console.log("    + opening html test page");
            } else {
                console.log(`    + importing ${request.url.split("/")[2]}`);
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


    async run(script) {
        this.server.listen(this.port);
        console.log(`- spinning up local http test server at "127.0.0.1:${this.port}/"`);

        console.log("- running tests:");
        const browser = await puppeteer.launch();
        await browser.createIncognitoBrowserContext();
        
        const page = await browser.newPage();
        page.on("console", msg => {
            msg._args.forEach((arg, i) => console.log(`      > ${i}: ${arg}`));
        });

        await page.goto(`http://127.0.0.1:${this.port}/`);
        
        console.log("    + appending test scripts");
        await page.evaluate(script => {
            const scriptTag = document.createElement("script");
            scriptTag.type = "module";
            scriptTag.innerHTML = script;
            document.head.append(scriptTag);
        }, script);
        
        await page.waitForFunction("typeof window.test !== 'undefined'");

        console.log("    + running test functions");
        const result = await page.evaluate(async () => await window.test.run());
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

export { HTMLPageServer };