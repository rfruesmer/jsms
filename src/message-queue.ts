import { Message } from "./message";
import { checkState, checkArgument } from "./preconditions";
import { MessageHeader } from "./message-header";
import { Deferred } from "./deferred";

export type MessageQueueReceiverCallback = (message: Message) => object;

class MessageQueueEntry {
    public message!: Message;
    public deferred!: Deferred<Message, Error>;
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

    private receiverCallback!: MessageQueueReceiverCallback;
    private queue: MessageQueueEntry[] = [];

    constructor(private name: string) {}

    public setReceiver(queueName: string, callback: MessageQueueReceiverCallback): void {
        checkArgument(!!callback, "callback is undefined");
        checkState(!this.receiverCallback, "Queue already has a receiver.");  // Check that there's only one receiver for now

        this.receiverCallback = callback;

        this.sendPendingMessages(); 
    }
    
    private sendPendingMessages(): void {
        if (!this.receiverCallback) {
            // nothing to do
            return;
        }

        const queueCopy = [... this.queue];
        queueCopy.forEach((entry: MessageQueueEntry) => {
            this.sendInternal(entry);
        });
    }
    
    private sendInternal(entry: MessageQueueEntry): void {
        try {
            const responseBody = this.receiverCallback(entry.message);
            if (responseBody) {
                const responseHeader = new MessageHeader(this.name, entry.message.header.correlationID, 0);
                const response = new Message(responseHeader, responseBody);
                entry.deferred.resolve(response);
            }
//            this.remove(message);
        }
        catch (error) {
            console.error(error);
        }
    }
    
    // private remove(message: Message): void {
    //     const messageIndex = this.queue.indexOf(message);
    //     this.queue.splice(messageIndex, 1);

    //     const promise = this.queuePromises.get(message);
    //     if (promise) {
    //         this.queuePromises.delete(message);
    //         Promise.resolve(promise);
    //     }
    // }

    public send(message: Message): Deferred<Message, Error> {
        const deferred = this.push(message);
        this.sendPendingMessages(); 

        return deferred;
    }

    private push(message: Message): Deferred<Message, Error> {
        const entry = new MessageQueueEntry();
        entry.message = message;
        entry.deferred = new Deferred<Message, Error>();

        this.queue.push(entry);

        return entry.deferred;
    }
}