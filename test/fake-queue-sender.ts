import { JsQueueSender } from "../src/internal/js-queue-sender";
import { JsmsMessage } from "../src/jsms-message";
import { FakeConnection } from "./fake-connection";
import { JsmsDeferred } from "../src/jsms-deferred";

export class FakeQueueSender extends JsQueueSender {

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {

        // NOTE: a custom message producer isn't limited to sending messages 
        // to the connection but can do custom things with the message 

        const connection = this.getConnection() as FakeConnection;
        return connection.send(message);
    }
}