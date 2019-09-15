import { JsQueueSender } from "@/js-queue-sender";
import { JsmsMessage } from "@/jsms-message";
import { FakeConnection } from "./fake-connection";
import { JsmsDeferred } from "@/jsms-deferred";

export class FakeQueueSender extends JsQueueSender {

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {

        // NOTE: a custom message producer isn't limited to sending messages 
        // to the connection but can do custom things with the message 

        const connection = this.getConnection() as FakeConnection;
        return connection.send(message);
    }
}