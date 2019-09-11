import { JsQueueSender } from "@/js-queue-sender";
import { JsmsMessage } from "@/jsms-message";
import { FakeConnection } from "./fake-connection";

export class FakeQueueSender extends JsQueueSender {

    public send(message: JsmsMessage): Promise<JsmsMessage> {

        // NOTE: a custom message producer isn't limited to calling super, 
        // but can do custom things with the message now

        const promise = new Promise<JsmsMessage>((resolve, reject) => {
            const connection = this.getConnection() as FakeConnection;
            connection.send(message);
            resolve();
        });

        return promise;
    }
}