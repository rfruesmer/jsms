import { v4 } from "uuid";
import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageHeader } from "./jsms-message-header";
import { JsmsQueue } from "./jsms-queue";
import { checkState, checkArgument } from "./preconditions";
import { JsConnection } from "./js-connection";
import { MessageListenerCallback, JsmsTopic } from "./jsms-topic";
import { JsmsDestination } from "./jsms-destination";

export class JsmsService {
    private defaultConnection = new JsConnection();
    private connections = new Map<JsmsDestination, JsmsConnection>();

    // TODO: remove queues/topics - they are already present in the connections
    private queues = new Map<string, JsmsQueue>();
    private topics = new Map<string, JsmsTopic>();

    // TODO: move to message producer (???)
    public static createMessage(channel: string, body: object, timeToLive: number = 0, correlationID: string = v4()): JsmsMessage {
        return new JsmsMessage(new JsmsMessageHeader(channel, correlationID, timeToLive), body);
    }

    public send(queueName: string, messageBody: object = {}, timeToLive: number = 0): Promise<JsmsMessage> {
        const queue = this.getQueue(queueName);
        const connection = this.getConnection(queue);
        const producer = connection.getProducer(queue);
        const message = JsmsService.createMessage(queueName, messageBody, timeToLive);
        
        return producer.send(message);
    }

    private getQueue(queueName: string): JsmsQueue {
        let queue = this.queues.get(queueName);
        if (!queue) {
            queue = this.createQueue(queueName);
        }

        return queue;
    }

    private getConnection(destination: JsmsDestination): JsmsConnection {
        const connection = this.connections.get(destination);
        // @ts-ignore: connection is guaranteed to be valid here
        return connection;
    }

    public createQueue(queueName: string, connection: JsmsConnection = this.defaultConnection): JsmsQueue {
        checkState(!this.queues.has(queueName));

        const queue = connection.createQueue(queueName);
        this.queues.set(queueName, queue);
        this.connections.set(queue, connection);

        return queue;
    }

    public receive(queueName: string): JsmsDeferred<JsmsMessage, object, Error> {
        const queue = this.getQueue(queueName);
        const connection = this.getConnection(queue);
        const consumer = connection.getConsumer(queue);

        return consumer.receive();
    }

    public close(): void {
        this.queues.forEach((queue: JsmsQueue) => queue.close());
    }

    public subscribe(topicName: string, subscriber: MessageListenerCallback): void {
        const topic = this.getTopic(topicName);
        topic.subscribe(subscriber);
    }

    private getTopic(topicName: string): JsmsTopic {
        let topic = this.topics.get(topicName);
        if (!topic) {
            topic = this.createTopic(topicName);
        }

        return topic;
    }

    public createTopic(topicName: string, connection: JsmsConnection = this.defaultConnection): JsmsTopic {
        checkState(!this.topics.has(topicName));

        const topic = connection.createTopic(topicName);
        this.topics.set(topicName, topic);
        this.connections.set(topic, connection);

        return topic;
    }

    public publish(topicName: string, messageBody: object = {}): void {
        const topic = this.getTopic(topicName);
        const connection = this.getConnection(topic);
        const producer = connection.getProducer(topic);
        const message = JsmsService.createMessage(topicName, messageBody);
        
        producer.send(message);
    }
}
