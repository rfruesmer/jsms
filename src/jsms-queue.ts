import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";


/**
 *  JsmsQueue is used for point-to-point (PTP) messaging:
 *
 *  - Each queue/message has only one consumer
 *
 *  - A sender and a receiver of a message have no timing dependencies.
 *    The receiver can fetch the message whether or not it was running
 *    when the client sent the message.
 *
 *  - Queues retain all messages sent to them until the messages are
 *    consumed or until the message expires.
 *
 *  - The receiver acknowledges the successful processing of a message.
 *
 *  Use PTP messaging when every message you send must be processed
 *  successfully by one consumer.
 *
 */
export class JsmsQueue extends JsmsDestination {
    private entries: JsmsMessage[] = [];
    private maintenanceInterval: any;

    constructor(name: string) {
        super(name);
        this.maintenanceInterval = setInterval(this.removeExpiredMessages, 1000);
    }

    public enqueue(message: JsmsMessage): void {
        this.entries.push(message);
    }

    public dequeue(): JsmsMessage | undefined {
        this.removeExpiredMessages();
        if (this.entries.length === 0) {
            return undefined;
        }

        const message = this.entries[0];
        this.entries.shift();
        return message;
    }

    private removeExpiredMessages = () => {
        const currentTimeMillis = new Date().getTime();
        this.entries
            .filter(
                (message: JsmsMessage) => message.header.expiration > 0 && currentTimeMillis > message.header.expiration
            )
            .map((message: JsmsMessage) => this.entries.indexOf(message))
            // TODO: consider moving the message to a dead letter queue
            .forEach((index: number) => this.entries.splice(index, 1));
    };

    public close(): void {
        clearInterval(this.maintenanceInterval);
    }
}
