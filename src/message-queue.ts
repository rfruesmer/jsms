import { Message } from "./message";
import { checkState } from "./preconditions";
import { Deferred } from "./deferred";

export type MessageQueueReceiverCallback = (message: Message) => object;

class MessageQueueEntry {
    constructor(public message: Message, 
                public producer: Deferred<Message, void, void>) {}
}

/**
 *  Implements point-to-point (PTP) messaging:
 * 
 *  - Each message has only one consumer
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
export class MessageQueue {
    private consumer!: Deferred<Message, object, Error> | null;
    private queue: MessageQueueEntry[] = [];
    private currentEntry!: MessageQueueEntry;
    private maintenanceInterval: any;

    constructor(private name: string) {
        this.maintenanceInterval = setInterval(this.removeExpiredMessages, 1000);
    }

    private removeExpiredMessages = () => {
        const currentTime = new Date().getTime();

        this.queue
            .filter((entry: MessageQueueEntry) => entry.message.header.expiration > 0 && currentTime > entry.message.header.expiration)
            .map((entry: MessageQueueEntry) => this.queue.indexOf(entry))
            .forEach((index: number) => this.queue.splice(index, 1));
    }

    public receive(): Deferred<Message, object, Error> {
        checkState(!this.consumer, "Queue already has a receiver.");  // Check that there's only one receiver for now

        const consumer = new Deferred<Message, object, Error>(() => {
            this.sendNextMessage();
        })
        consumer.promise.then((response: Message) => {
            this.currentEntry.producer.resolve(response);
        });

        this.consumer = consumer;

        return consumer;
    }

    private sendNextMessage(): boolean {
        try {
            this.removeExpiredMessages();

            if (!this.consumer 
                    || this.queue.length === 0) {
                return false;
            }

            this.currentEntry = this.queue[0];
            this.consumer.resolve(this.currentEntry.message);
            this.queue.shift();
            this.consumer = null;
        }
        catch (error) {
            console.error(error);
            return false;
        }

        return true;
    }
    
    public send(message: Message): Promise<Message> {
        const producer = new Deferred<Message, void, void>();

        this.queue.push(new MessageQueueEntry(message, producer));

        if (this.consumer) {
            this.sendNextMessage();
        }

        return producer.promise;
    }

    public close(): void {
        clearInterval(this.maintenanceInterval);
    }
}