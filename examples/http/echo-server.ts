import { JsmsService } from "../../src/jsms-service";
import { HttpConnection } from "./http-connection";

// --------------------------------------------------------------------------------------------------------------------

const messageService = new JsmsService();
const httpConnection = new HttpConnection("", 0, 8080);
messageService.createQueue("/echo", httpConnection);

// To demonstrate queuing of messages, the listener will be started delayed:
setTimeout(() => {
    messageService.receive("/echo")
        .then(message => {
            return { response: "PONG" };
        });
}, 30000);

// --------------------------------------------------------------------------------------------------------------------