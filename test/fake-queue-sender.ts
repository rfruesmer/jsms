import { JsmsDeferred } from "../src/jsms-deferred";
import { JsmsMessage } from "../src/jsms-message";
import { JsmsQueueSender } from "../src/jsms-queue-sender";
import { FakeConnection } from "./fake-connection";

export class FakeQueueSender extends JsmsQueueSender {

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {

        // NOTE: a custom message producer isn't limited to sending messages 
        // to the connection but can do custom things with the message 

        const connection = this.connection as FakeConnection;
        return connection.send(message);
    }
}