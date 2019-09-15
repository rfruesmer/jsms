import { JsmsConnection } from "../jsms-connection";
import { JsmsDeferred } from "../jsms-deferred";
import { JsmsDestination } from "../jsms-destination";
import { JsmsMessage } from "../jsms-message";
import { JsmsMessageProducer } from "../jsms-message-producer";
import { JsmsQueue } from "../jsms-queue";

export class JsQueueSender extends JsmsMessageProducer {
    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        // since this an in-process producer, it can directly dispatch to the consumer
        const destination = this.getDestination();
        const consumer = this.getConnection().getConsumer(destination);

        return consumer.onMessage(message);
    }
}