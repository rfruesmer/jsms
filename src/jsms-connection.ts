import { JsmsDestination } from "./jsms-destination";
import { JsmsMessageConsumer } from "./jsms-message-consumer";
import { JsmsMessageProducer } from "./jsms-message-producer";
import { JsmsQueue } from "./jsms-queue";
import { checkArgument, checkState } from "./preconditions";
import { JsmsTopic } from "./jsms-topic";


export abstract class JsmsConnection {
    protected queues = new Map<string, JsmsQueue>();
    protected topics = new Map<string, JsmsTopic>();
    protected producers = new Map<JsmsDestination, JsmsMessageProducer>();
    protected consumers = new Map<JsmsDestination, JsmsMessageConsumer>();

    public abstract createQueue(queueName: string): JsmsQueue;
    public abstract createTopic(topicName: string): JsmsTopic;
    protected abstract createProducer(destination: JsmsDestination): JsmsMessageProducer;
    protected abstract createConsumer(destination: JsmsDestination): JsmsMessageConsumer;

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

    protected getDestinationFor(channel: string): JsmsDestination | undefined {
        const  destination = this.queues.get(channel);
        return destination ? destination : this.topics.get(channel);
    }

    public getConsumer(destination: JsmsDestination): JsmsMessageConsumer {
        checkArgument(this.consumers.has(destination));
        // @ts-ignore: check for undefined already done before via checkArgument
        return this.consumers.get(destination);
    }

    public getProducer(destination: JsmsDestination): JsmsMessageProducer {
        checkArgument(this.producers.has(destination));
        // @ts-ignore: check for undefined already done before via checkArgument
        return this.producers.get(destination);
    }
}