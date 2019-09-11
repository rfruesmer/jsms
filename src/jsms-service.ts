import { JsConnection } from "./js-connection";
import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsQueue } from "./jsms-queue";
import { JsmsTopic, MessageListenerCallback } from "./jsms-topic";
import { checkState } from "./preconditions";

/**
 * Convenience facade for simple interaction with the message system.
 */
export class JsmsService {
    private defaultConnection = new JsConnection();
    private connections = new Map<JsmsDestination, JsmsConnection>();
    private queues = new Map<string, JsmsQueue>();
    private topics = new Map<string, JsmsTopic>();

    /**
     *  Sends a message to the specified queue.
     * 
     *  Note: if the queue doesn't exist yet, a new queue using the default 
     *  connection will be generated automatically, .
     */
    public send(queueName: string, messageBody: object = {}, timeToLive: number = 0): Promise<JsmsMessage> {
        const queue = this.getQueue(queueName);
        const connection = this.getConnection(queue);
        const producer = connection.getProducer(queue);
        const message = JsmsMessage.create(queueName, messageBody, timeToLive);

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

    /**
     *  Creates a new queue for the given connection.
     */
    public createQueue(queueName: string, connection: JsmsConnection = this.defaultConnection): JsmsQueue {
        checkState(!this.queues.has(queueName));

        const queue = connection.createQueue(queueName);
        this.queues.set(queueName, queue);
        this.connections.set(queue, connection);

        return queue;
    }

    /**
     *  Receives the next message from the given queue.
     */
    public receive(queueName: string): JsmsDeferred<JsmsMessage, object, Error> {
        const queue = this.getQueue(queueName);
        const connection = this.getConnection(queue);
        const consumer = connection.getConsumer(queue);

        return consumer.receive();
    }

    /**
     *  Registers a callback function on the given topic.
     * 
     *  Note: if the topic doesn't exist yet, a new topic using the default 
     *  connection will be generated automatically.
     */
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

    /**
     *  Creates a new topic for the given connection.
     */
    public createTopic(topicName: string, connection: JsmsConnection = this.defaultConnection): JsmsTopic {
        checkState(!this.topics.has(topicName));

        const topic = connection.createTopic(topicName);
        this.topics.set(topicName, topic);
        this.connections.set(topic, connection);

        return topic;
    }

    /**
     * Publishes a message to the given topic.
     * 
     *  Note: if the topic doesn't exist yet, a new topic using the default 
     *  connection will be generated automatically.
     */
    public publish(topicName: string, messageBody: object = {}): void {
        const topic = this.getTopic(topicName);
        const connection = this.getConnection(topic);
        const producer = connection.getProducer(topic);
        const message = JsmsMessage.create(topicName, messageBody);

        producer.send(message);
    }

    /**
     *  Releases all resources allocated by this service.
     */
    public close(): void {
        this.queues.forEach((queue: JsmsQueue) => queue.close());
    }
}
