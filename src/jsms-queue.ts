import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { checkArgument } from "./preconditions";


type MessageExpiredListener = (message: JsmsMessage) => void;

/**
 *  JsmsQueue is used for point-to-point (PTP) messaging:
 *
 *  * Each queue/message has only one consumer
 *
 *  * A sender and a receiver of a message have no timing dependencies.
 *    The receiver can fetch the message whether or not it was running
 *    when the client sent the message.
 *
 *  * Queues retain all (up to maxSize) messages sent to them until 
 *    the messages are consumed, the message expires or the queue is 
 *    closed - messages aren't persisted.
 *
 *  Use PTP messaging when every message you send must be processed
 *  successfully by one consumer.
 *
 */
export class JsmsQueue extends JsmsDestination {
    private entries: JsmsMessage[] = [];
    private maintenanceInterval: any;
    private expiredListeners = new Array<MessageExpiredListener>();

    constructor(name: string) {
        super(name);
        this.maintenanceInterval = setInterval(this.removeExpiredMessages, 1000);
    }

    private removeExpiredMessages = () => {
        const currentTimeMillis = new Date().getTime();
        this.entries
            .filter((message: JsmsMessage) => message.header.expiration > 0 && currentTimeMillis > message.header.expiration)
            .map((message: JsmsMessage) => this.entries.indexOf(message))
            .forEach((index: number) => {
                const removedMessages = this.entries.splice(index, 1);
                this.expiredListeners.forEach((listener) => listener(removedMessages[0]));
            });
    }

    public enqueue(message: JsmsMessage): void {
        checkArgument(message.header.channel === this.getName());
        this.entries.push(message);
    }

    public dequeue(): JsmsMessage | undefined {
        this.removeExpiredMessages();
        return this.entries.shift();
    }

    public addMessageExpiredListener(listener: MessageExpiredListener): void {
        if (this.expiredListeners.indexOf(listener) === -1) {
            this.expiredListeners.push(listener);
        }
    }

    public close(): void {
        clearInterval(this.maintenanceInterval);
    }
}
