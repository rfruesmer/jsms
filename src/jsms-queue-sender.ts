import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageProducer } from "./jsms-message-producer";

export class JsmsQueueSender extends JsmsMessageProducer {
    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        return this.getConnection().send(message);
    }

    /**
     *  Only used for JS-/in-process transport.
     */
    public dispatchInProcess(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        const destination = this.getDestination();
        const consumer = this.getConnection().getConsumer(destination);

        return consumer.onMessage(message);
    }
}