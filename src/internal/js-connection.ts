import { JsmsDeferred } from "src/jsms-deferred";
import { JsmsMessage } from "src/jsms-message";
import { JsmsConnection } from "../jsms-connection";
import { JsmsQueueSender } from "../jsms-queue-sender";

/**
 * The JsConnection allows clients to connect to each other inside the 
 * JavaScript environment without the overhead of network communication. 
 */
export class JsConnection extends JsmsConnection {

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        const queue = this.getDestinationFor(message.header.channel);
        const producer = this.getProducer(queue) as JsmsQueueSender;

        return producer.dispatchInProcess(message);
    }
}
