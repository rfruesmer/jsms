import { checkArgument, checkState } from "./internal/preconditions";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageConsumer } from "./jsms-message-consumer";
import { JsmsMessageProducer } from "./jsms-message-producer";
import { JsmsQueue } from "./jsms-queue";
import { JsmsQueueReceiver } from "./jsms-queue-receiver";
import { JsmsQueueSender } from "./jsms-queue-sender";
import { JsmsTopic } from "./jsms-topic";
import { JsmsTopicPublisher } from "./jsms-topic-publisher";
import { JsmsTopicSubscriber } from "./jsms-topic-subscriber";

/**
 *  A Connection object is a client's active connection to its JSMS provider
 */
export abstract class JsmsConnection {
    protected queues = new Map<string, JsmsQueue>();
    protected topics = new Map<string, JsmsTopic>();
    protected producers = new Map<JsmsDestination, JsmsMessageProducer>();
    protected consumers = new Map<JsmsDestination, JsmsMessageConsumer>();

    /**
     *  Creates a queue with the given name.
     */
    public createQueue(queueName: string): JsmsQueue {
        const queue = new JsmsQueue(queueName);
        this.addQueue(queue, new JsmsQueueSender(this, queue), new JsmsQueueReceiver(this, queue));
        
        return queue;
    }

    /**
     *  Creates a topic with the given name.
     */
    public createTopic(topicName: string): JsmsTopic {
        const topic = new JsmsTopic(topicName);
        this.addTopic(topic, new JsmsTopicPublisher(this, topic), new JsmsTopicSubscriber(this, topic));
        return topic;
    }

    /**
     *  Override to implement provider-specific transport.
     * 
     *  @param message the message to send
     */
    public abstract send(message: JsmsMessage): JsmsDeferred<JsmsMessage>;

    protected addQueue(queue: JsmsQueue, producer: JsmsMessageProducer, consumer: JsmsMessageConsumer): void {
        checkState(!this.queues.has(queue.getName()), "A queue with the same name is already registered");

        this.queues.set(queue.getName(), queue);
        this.producers.set(queue, producer);
        this.consumers.set(queue, consumer);
    }

    protected addTopic(topic: JsmsTopic, producer: JsmsMessageProducer, consumer: JsmsMessageConsumer): void {
        checkState(!this.topics.has(topic.getName()), "A topic with the same name is already registered");

        this.topics.set(topic.getName(), topic);
        this.producers.set(topic, producer);
        this.consumers.set(topic, consumer);
    }

    protected getDestinationFor(name: string): JsmsDestination {
        let destination = this.queues.get(name) as JsmsDestination | undefined;
        if (!destination) {
            destination = this.topics.get(name);
        }
        checkState(!!destination, "Unknown destination: " + name);
        // @ts-ignore: check for undefined already done before via checkState
        return destination;
    }

    /**
     * Returns the message consumer of the specified destination.
     */
    public getConsumer(destination: JsmsDestination): JsmsMessageConsumer {
        checkArgument(this.consumers.has(destination));
        // @ts-ignore: check for undefined already done before via checkArgument
        return this.consumers.get(destination);
    }

    /**
     * Returns the message producer of the specified destination.
     */
    public getProducer(destination: JsmsDestination): JsmsMessageProducer {
        checkArgument(this.producers.has(destination));
        // @ts-ignore: check for undefined already done before via checkArgument
        return this.producers.get(destination);
    }

    /**
     *  Closes the connection.
     * 
     *  Since a provider typically allocates significant resources on behalf 
     *  of a connection, clients should close these resources when they are 
     *  not needed.
     */
    public close(): void {
        this.queues.forEach((queue) => queue.close());
        this.topics.forEach((topic) => topic.close());
    }
}
