import { v4 } from "uuid";
import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageHeader } from "./jsms-message-header";
import { JsmsQueue } from "./jsms-queue";
import { checkState, checkArgument } from "./preconditions";
import { JsConnection } from "./js-connection";

export class JsmsService {
    private queueConnections = new Map<JsmsQueue, JsmsConnection>();
    private queues = new Map<string, JsmsQueue>();

    // TODO: move to message producer (???)
    public static createMessage(channel: string, body: object, timeToLive: number = 0, correlationID: string = v4()): JsmsMessage {
        return new JsmsMessage(new JsmsMessageHeader(channel, correlationID, timeToLive), body);
    }

    public send(queueName: string, messageBody: object = {}, timeToLive: number = 0): Promise<JsmsMessage> {
        const queue = this.getQueue(queueName);
        const connection = this.queueConnections.get(queue);
        // @ts-ignore: connection is guaranteed to be valid at this point
        const producer = connection.getProducer(queue);
        const message = JsmsService.createMessage(queueName, messageBody, timeToLive);
        
        return producer.send(message);
    }

    private getQueue(queueName: string): JsmsQueue {
        let queue = this.queues.get(queueName);
        if (!queue) {
            queue = this.createQueue(queueName);
            this.queues.set(queueName, queue);
        }

        return queue;
    }

    public createQueue(queueName: string, connection: JsmsConnection = new JsConnection()): JsmsQueue {
        checkState(!this.queues.has(queueName));

        const queue = connection.createQueue(queueName);
        this.queues.set(queueName, queue);
        this.queueConnections.set(queue, connection);

        return queue;
    }

    public receive(queueName: string): JsmsDeferred<JsmsMessage, object, Error> {
        const queue = this.getQueue(queueName);
        const connection = this.queueConnections.get(queue);
        // @ts-ignore: connection is guaranteed to be valid at this point
        const consumer = connection.getConsumer(queue);

        return consumer.receive();
    }

    public close(): void {
        this.queues.forEach((queue: JsmsQueue) => queue.close());
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
