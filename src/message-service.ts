import { v4 } from "uuid";
import { Message } from "./message";
import { MessageHeader } from "./message-header";
import { MessageQueue } from "./message-queue";
import { Deferred } from "./deferred";
import { MessageTopic, SubscriberCallback } from "./message-topic";

export class MessageService {
    private queues = new Map<string, MessageQueue>();
    private topics = new Map<string, MessageTopic>();

    public send(queueName: string, messageBody: object = {}, timeToLive: number = 0): Promise<Message> {
        const queue = this.getQueue(queueName);
        return queue.send(this.createMessage(queueName, messageBody, timeToLive));
    }

    private getQueue(queueName: string): MessageQueue {
        let queue = this.queues.get(queueName);
        if (!queue) {
            queue = new MessageQueue(queueName);
            this.queues.set(queueName, queue);
        }

        return queue;
    }

    public createMessage(channel: string, body: object, timeToLive: number = 0): Message {
        return new Message(new MessageHeader(channel, v4(), timeToLive), body);
    }

    public receive(queueName: string): Deferred<Message, object, Error> {
        const queue = this.getQueue(queueName);
        return queue.receive();
    }

    public close(): void {
        this.queues.forEach((queue: MessageQueue) => queue.close());
    }

    public subscribe(topicName: string, subscriber: SubscriberCallback): void {
        const topic = this.getTopic(topicName);
        topic.subscribe(subscriber);
    }

    private getTopic(topicName: string): MessageTopic {
        let topic = this.topics.get(topicName);
        if (!topic) {
            topic = new MessageTopic(topicName);
            this.topics.set(topicName, topic);
        }

        return topic;
    }

    public publish(topicName: string, messageBody: object): void {
        const topic = this.topics.get(topicName);
        if (topic) {
            topic.publish(this.createMessage(topicName, messageBody));
        }
    }
}
