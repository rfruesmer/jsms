import { v4 } from "uuid";
import { Message } from "./message";
import { MessageHeader } from "./message-header";
import { MessageQueue, MessageQueueReceiverCallback } from "./message-queue";
import { Deferred } from "./deferred";


export class MessageService {
    private queues = new Map<string, MessageQueue>();

    public send(queueName: string, messageBody: object = {}): Promise<Message> {
        const queue = this.getQueue(queueName);
        return queue.send(this.createMessage(queueName, messageBody));
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

    public receive(queueName: string, callback: MessageQueueReceiverCallback): void {
        const queue = this.getQueue(queueName);
        return queue.setReceiver(queueName, callback);
    }
}