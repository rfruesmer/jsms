import { v4 } from "uuid";
import { Connection } from "./connection";
import { Deferred } from "./deferred";
import { Message } from "./message";
import { MessageHeader } from "./message-header";
import { MessageQueue } from "./message-queue";
import { checkState, checkArgument } from "./preconditions";

export class MessageService {
    private queueConnections = new Map<MessageQueue, Connection>();
    private queues = new Map<string, MessageQueue>();

    // TODO: move to message producer (???)
    public static createMessage(channel: string, body: object, timeToLive: number = 0, correlationID: string = v4()): Message {
        return new Message(new MessageHeader(channel, correlationID, timeToLive), body);
    }

    public createQueue(connection: Connection, queueName: string): MessageQueue {
        checkState(!this.queues.has(queueName));

        const queue = connection.createQueue(queueName);
        this.queues.set(queueName, queue);
        this.queueConnections.set(queue, connection);

        return queue;
    }

    public send(queueName: string, messageBody: object = {}, timeToLive: number = 0): Promise<Message> {
        checkArgument(this.queues.has(queueName));
        const queue = this.queues.get(queueName);
        // @ts-ignore: check for valid queue already done before via checkArgument
        const connection = this.queueConnections.get(queue);
        // @ts-ignore: connection is guaranteed to be valid at this point
        return connection.getProducer(queue).send(MessageService.createMessage(queueName, messageBody, timeToLive));
    }

    public receive(queueName: string): Deferred<Message, object, Error> {
        checkArgument(this.queues.has(queueName));
        const queue = this.queues.get(queueName);
        // @ts-ignore: check for valid queue already done before via checkArgument
        const connection = this.queueConnections.get(queue);
        // @ts-ignore: connection is guaranteed to be valid at this point
        return connection.getConsumer(queue).receive();
    }

    public close(): void {
        this.queues.forEach((queue: MessageQueue) => queue.close());
    }

//     public subscribe(topicName: string, subscriber: SubscriberCallback): void {
//         const topic = this.getTopic(topicName);
//         topic.subscribe(subscriber);
//     }

//     private getTopic(topicName: string): MessageTopic {
//         let topic = this.topics.get(topicName);
//         if (!topic) {
//             topic = new MessageTopic(topicName);
//             this.topics.set(topicName, topic);
//         }

//         return topic;
//     }

//     public publish(topicName: string, messageBody: object = {}): void {
//         const topic = this.topics.get(topicName);
//         if (topic) {
//             topic.publish(MessageService.createMessage(topicName, messageBody));
//         }
//     }
}
