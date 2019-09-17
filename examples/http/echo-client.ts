import { getLogger } from "@log4js-node/log4js-api";
import { JsmsService } from "../../src/jsms-service";
import { HttpConnection } from "./http-connection";

// --------------------------------------------------------------------------------------------------------------------

let done = false;

const logger = getLogger("echo-client");
logger.level = "debug";

// --------------------------------------------------------------------------------------------------------------------

const messageService = new JsmsService();
const httpConnection = new HttpConnection("localhost", 8080);
messageService.createQueue("/echo", httpConnection);

messageService.send("/echo", { request: "PING" })
    .then(response => {
        logger.info("Received response: " + JSON.stringify(response.body));
        done = true;
    })
    .catch(reason => {
        logger.warn(reason);
        done = true;
    });


// --------------------------------------------------------------------------------------------------------------------

// Keep node running until resolved/rejected
function mainLoop(): void {
    if (done) {
        process.exit(0);
    }

    setTimeout(() => {
        mainLoop();
    }, 100);
}

mainLoop();

// --------------------------------------------------------------------------------------------------------------------

