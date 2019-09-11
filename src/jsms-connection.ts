import { JsmsDestination } from "./jsms-destination";
import { JsmsMessageConsumer } from "./jsms-message-consumer";
import { JsmsMessageProducer } from "./jsms-message-producer";
import { JsmsQueue } from "./jsms-queue";
import { checkArgument, checkState } from "./preconditions";


export abstract class JsmsConnection {
    protected queues = new Map<string, JsmsQueue>();
    protected producers = new Map<JsmsQueue, JsmsMessageProducer>();
    protected consumers = new Map<JsmsQueue, JsmsMessageConsumer>();

    // TODO: consider moving creation of queues
    public abstract createQueue(queueName: string): JsmsQueue;

    protected addQueue(queue: JsmsQueue, producer: JsmsMessageProducer, consumer: JsmsMessageConsumer): void {
        checkState(!this.queues.has(queue.getName()), "A queue with the same name is already registered");

        this.queues.set(queue.getName(), queue);
        this.producers.set(queue, producer);
        this.consumers.set(queue, consumer);
    }

    public getConsumer(queue: JsmsQueue): JsmsMessageConsumer {
        checkArgument(this.consumers.has(queue));
        // @ts-ignore: check for undefined already done before via checkArgument
        return this.consumers.get(queue);
    }

    public getProducer(queue: JsmsQueue): JsmsMessageProducer {
        checkArgument(this.producers.has(queue));
        // @ts-ignore: check for undefined already done before via checkArgument
        return this.producers.get(queue);
    }
}