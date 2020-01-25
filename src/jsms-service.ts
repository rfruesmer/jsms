import { JsConnection } from "./js-connection";
import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageProducer } from "./jsms-message-producer";
import { JsmsQueue } from "./jsms-queue";
import { JsmsTopic, MessageListenerCallback } from "./jsms-topic";
import { checkState } from "./preconditions";

/**
 *  Convenience facade for simple interaction with the message system.
 * 
 *  Current limitations:
 * 
 * * Queue- and topic names must be unique, meaning that a queue 
 *   cannot share the same name with a topic and vice versa.
 * 
 */
export class JsmsService {
    private static readonly MAX_RETRIES = 60;
    private static readonly RETRY_INTERVAL = 100;

    private defaultConnection = new JsConnection();
    private connections = new Map<JsmsDestination, JsmsConnection>();
    private queues = new Map<string, JsmsQueue>();
    private topics = new Map<string, JsmsTopic>();

    /**
     *  Sends a message to the specified queue.
     *
     *  Note: if the queue doesn't exist yet, a new queue using the default
     *  JsConnection will be created.
     *
     *  @param queueName the name of the destination queue
     *  @param messageBody optional user-defined message data (payload)
     *  @param timeToLive time in milliseconds before the message expires
     *
     *  @returns a deferred promise that represents the response. If the
     *           listener doen't reply, the response body will be empty.
     *           If the message is invalid (e.g. expired) the promise will be
     *           rejected.
     */
    public send(queueName: string, messageBody: object = {}, timeToLive: number = -1): JsmsDeferred<JsmsMessage> {
        const queue = this.getQueue(queueName);
        const connection = this.getConnection(queue);
        const producer = connection.getProducer(queue);
        const message = JsmsMessage.create(queueName, messageBody, timeToLive);

        try {
            return producer.send(message);
        }
        catch (e) {
            return this.retry(message, producer);
        }
    }

    private retry(message: JsmsMessage, 
                  producer: JsmsMessageProducer, 
                  deferredRetry: JsmsDeferred<JsmsMessage> = new JsmsDeferred<JsmsMessage>(),
                  retryCount: number = 0): JsmsDeferred<JsmsMessage> {
        setTimeout(() => {
            try {
                const deferredResponse = producer.send(message);
                deferredResponse.then((response: JsmsMessage) => {
                    deferredRetry.resolve(response);
                });
            }
            catch (e) {
                if (message.isExpired()) {
                    deferredRetry.reject("message expired");
                }
                else if (retryCount > JsmsService.MAX_RETRIES) {
                    deferredRetry.reject("exceeded max retries");
                }
                else {
                    this.retry(message, producer, deferredRetry, retryCount + 1);
                }
            }
        }, JsmsService.RETRY_INTERVAL);

        return deferredRetry;
    }

    /** NO public API - only public visible for testing */
    public getQueue(queueName: string): JsmsQueue {
        let queue = this.queues.get(queueName);
        if (!queue) {
            queue = this.createQueue(queueName);
        }

        return queue;
    }

    /** NO public API - only public visible for testing */
    public getConnection(destination: JsmsDestination): JsmsConnection {
        const connection = this.connections.get(destination);
        // @ts-ignore: connection is guaranteed to be valid here
        return connection;
    }

    /**
     *  Creates a new queue for the given connection on this node.
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
    public receive(queueName: string): JsmsDeferred<JsmsMessage> {
        const queue = this.getQueue(queueName);
        const connection = this.getConnection(queue);
        const consumer = connection.getConsumer(queue);

        return consumer.receive();
    }

    /**
     *  Registers a callback function on the given topic.
     * 
     *  Note: if the topic doesn't exist yet, a new topic using the default 
     *  JsConnection will be created.
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
     *  Creates a new topic for the given connection on this node.
     */
    public createTopic(topicName: string, connection: JsmsConnection = this.defaultConnection): JsmsTopic {
        checkState(!this.topics.has(topicName));

        const topic = connection.createTopic(topicName);
        this.topics.set(topicName, topic);
        this.connections.set(topic, connection);

        return topic;
    }

    /**
     *  Publishes a message to the given topic.
     * 
     *  Note: if the topic doesn't exist yet, a new topic using the default 
     *  JsConnection will be created.
     * 
     *  @returns a deferred promise that represents the original message - it 
     *           will be resolved as soon as the message has been sent to all 
     *           subscribers.
     */
    public publish(topicName: string, messageBody: object = {}): void {
        const topic = this.getTopic(topicName);
        const connection = this.getConnection(topic);
        const producer = connection.getProducer(topic);
        const message = JsmsMessage.create(topicName, messageBody);

        producer.send(message);
    }

    /**
     *  Unsubscribes the listener from the specified topic.
     */
    public unsubscribe(topicName: string, subscriber: MessageListenerCallback): void {
        const topic = this.topics.get(topicName);
        if (topic) {
            topic.unsubscribe(subscriber);
        }        
    }

    /**
     *  Releases all resources allocated by this service.
     */
    public close(): void {
        this.connections.forEach((connection: JsmsConnection) => connection.close());
    }
}
