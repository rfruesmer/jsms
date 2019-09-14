import { JsQueueSender } from "@/js-queue-sender";
import { JsmsMessage } from "@/jsms-message";
import { FakeConnection } from "./fake-connection";
import { JsmsDeferred } from "@/jsms-deferred";

export class FakeQueueSender extends JsQueueSender {

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {

        // NOTE: a custom message producer isn't limited to calling super, 
        // but can do custom things with the message now

        const connection = this.getConnection() as FakeConnection;
        connection.send(message);

        const deferred = new JsmsDeferred<JsmsMessage>();
        deferred.resolve(message);

        return deferred;
    }
}