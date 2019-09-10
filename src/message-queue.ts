import { Deferred } from "./deferred";
import { Destination } from "./destination";
import { Message } from "./message";
import { MessageService } from "./message-service";

class MessageQueueEntry {
    constructor(public message: Message, public producerDeferred: Deferred<Message, object, Error>) { }
}

/**
 *  Implements point-to-point (PTP) messaging:
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
export class MessageQueue implements Destination {
    private name: string;
    private entries: MessageQueueEntry[] = [];
    private maintenanceInterval: any;

    // TODO: consider renaming to receiver-/consumer-deferreds
    private deferredDequeues = new Array<Deferred<Message, object, Error>>();

    constructor(name: string) {
        this.name = name;
        this.maintenanceInterval = setInterval(this.removeExpiredMessages, 1000);
    }

    public getName(): string {
        return this.name;
    }

    public receive(): Deferred<Message, object, Error> {
        return this.dequeue();
    }
    
    private dequeue(): Deferred<Message, object, Error> {

        this.removeExpiredMessages();

        // TODO: consider moving creation of the deferred object to receive()
        const deferredDequeue = new Deferred<Message, object, Error>(() => {
            if (this.entries.length === 0) {
                return;
            }
            
            const currentEntry = this.entries[0];
            this.entries.shift();

            deferredDequeue.promise.then((responseBody: object) => {
                const request = currentEntry.message;
                const response = MessageService.createMessage(request.header.channel, responseBody, 0, request.header.correlationID);
                currentEntry.producerDeferred.resolve(response);
            });

            try {
                deferredDequeue.resolve(currentEntry.message);
            }
            catch (error) {
                currentEntry.producerDeferred.reject(error);
            }
        });

        if (this.entries.length === 0) {
            this.deferredDequeues.push(deferredDequeue);
        }

        return deferredDequeue;
    }

    public send(message: Message): Promise<Message> {
        const deferred = new Deferred<Message, object, Error>();

        if (this.deferredDequeues.length > 0) {
            const deferredDequeue = this.deferredDequeues[0];
            this.deferredDequeues.shift();
            deferredDequeue.resolve(message);
            deferredDequeue.promise.then((response: Message) => deferred.resolve(response));
        }
        else {
            this.enqueue(message, deferred);
        }

        return deferred.promise;
    }
    
    private enqueue(message: Message, producerDeferred: Deferred<Message, object, Error>): void {
        this.entries.push(new MessageQueueEntry(message, producerDeferred));
    }

    private removeExpiredMessages = () => {
        const currentTimeMillis = new Date().getTime();
        this.entries.filter((entry: MessageQueueEntry) => entry.message.header.expiration > 0 && currentTimeMillis > entry.message.header.expiration)
            .map((entry: MessageQueueEntry) => this.entries.indexOf(entry))
            // TODO: consider moving the message to a dead letter queue
            .forEach((index: number) => this.entries.splice(index, 1));
    };
    
    public close(): void {
        clearInterval(this.maintenanceInterval);
    }  
}

// export class MessageQueue {
//     private name: string;
//     private producer!: MessageProducer;
//     private consumer!: MessageConsumer;

//     constructor(name: string) {
//         this.name = name;
//     }

//     public setProducer(producer: MessageProducer): void {
//         this.producer = this.producer;
//     }

//     public send(message: Message): Promise<Message> {
//         return this.producer.send(message);
//     }

//     public setConsumer(consumer: MessageConsumer): void {
//         this.consumer = consumer;
//     }

//     public receive(): Deferred<Message, object, Error> {
//         return this.consumer.receive();
//     }

//     public close(): void {
//         // clearInterval(this.maintenanceInterval);
//     }


    // private queue: MessageQueueEntry[] = [];
    // private consumer!: MessageConsumer;
    // private consumerDeferred!: Deferred<Message, object, Error> | null;
    // private currentEntry!: MessageQueueEntry;
    // private maintenanceInterval: any;

    // constructor(name: string) {
    //     this.name = name;
    //     this.maintenanceInterval = setInterval(this.removeExpiredMessages, 1000);
    // }

    // private removeExpiredMessages = () => {
    //     const currentTime = new Date().getTime();

    //     this.queue
    //         .filter(
    //             (entry: MessageQueueEntry) =>
    //                 entry.message.header.expiration > 0 && currentTime > entry.message.header.expiration
    //         )
    //         .map((entry: MessageQueueEntry) => this.queue.indexOf(entry))
    //         .forEach((index: number) => this.queue.splice(index, 1));
    // };

    // public getName(): string {
    //     return this.name;
    // }

    // public receive(): Deferred<Message, object, Error> {
    //     checkState(!this.consumerDeferred, "Queue already has a receiver."); // Check that there's only one receiver for now

    //     const consumerDeferred = new Deferred<Message, object, Error>(() => {
    //         this.sendNextMessage();
    //     });
    //     consumerDeferred.promise.then((response: Message) => {
    //         this.currentEntry.producerDeferred.resolve(response);
    //     });

    //     this.consumerDeferred = consumerDeferred;

    //     return consumerDeferred;
    // }

    // private sendNextMessage(): boolean {
    //     this.removeExpiredMessages();

    //     if (!this.hasConsumer() 
    //             || this.queue.length === 0) {
    //         return false;
    //     }

    //     try {
    //         this.currentEntry = this.queue[0];
    //         if (this.consumer) {
    //             this.consumer.receive(this.currentEntry.message);
    //         }
    //         else if (this.consumerDeferred) {
    //             this.consumerDeferred.resolve(this.currentEntry.message);
    //         }
    //     }
    //     catch (error) {
    //         this.currentEntry.producerDeferred.reject(error);
    //         return false;
    //     }
    //     finally {
    //         this.consumerDeferred = null;
    //         this.queue.shift();
    //     }

    //     return true;
    // }

    // public send(message: Message): Promise<Message> {
    //     const producerDeferred = new Deferred<Message, void, void>();

    //     this.queue.push(new MessageQueueEntry(message, producerDeferred));

    //     if (this.hasConsumer()) {
    //         this.sendNextMessage();
    //     }

    //     return producerDeferred.promise;
    // }

    // private hasConsumer(): boolean {
    //     return !!this.consumerDeferred || !!this.consumer;
    // }

    // public close(): void {
    //     clearInterval(this.maintenanceInterval);
    // }
// }
