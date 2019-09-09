import { Message } from "./message";

export type SubscriberCallback = (message: Message) => void;

/**
 *  Implements publish/subscribe messaging.
 * 
 *  - Topics take care of distributing the messages arriving from 
 *    multiple publishers to its multiple subscribers.
 * 
 *  - Topics retain messages only as long as it takes to distribute 
 *    them to current subscribers.
 * 
 *  - Each message may have multiple consumers.
 * 
 *  - Publishers and subscribers have a timing dependency. A client 
 *    that subscribes to a topic can consume only messages published 
 *    after the client has created a subscription, and the subscriber 
 *    must continue to be active in order for it to consume messages.
 * 
 */
export class MessageTopic {
    private subscribers = new Array<SubscriberCallback>();

    constructor(private name: string) {}

    public subscribe(subscriber: SubscriberCallback): void {
        if (this.subscribers.indexOf(subscriber) === -1) {
            this.subscribers.push(subscriber);
        }
    }

    public publish(message: Message): void {
        this.subscribers.forEach((subscriber) => subscriber(message));
    }
}