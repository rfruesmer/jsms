import { JsmsDestination } from "./jsms-destination";
import { JsmsMessageConsumer } from "./jsms-message-consumer";
import { JsmsMessageProducer } from "./jsms-message-producer";
import { JsmsMessageQueue } from "./jsms-message-queue";
import { checkArgument, checkState } from "./preconditions";


export abstract class JsmsConnection {
    protected queues = new Map<string, JsmsMessageQueue>();
    protected producers = new Map<JsmsMessageQueue, JsmsMessageProducer>();
    protected consumers = new Map<JsmsMessageQueue, JsmsMessageConsumer>();

    public abstract createQueue(queueName: string): JsmsMessageQueue;

    protected addQueue(queue: JsmsMessageQueue, producer: JsmsMessageProducer, consumer: JsmsMessageConsumer): void {
        checkState(!this.queues.has(queue.getName()), "A queue with the same name is already registered");

        this.queues.set(queue.getName(), queue);
        this.producers.set(queue, producer);
        this.consumers.set(queue, consumer);
    }

    public getConsumer(queue: JsmsMessageQueue): JsmsMessageConsumer {
        checkArgument(this.consumers.has(queue));
        // @ts-ignore: check for undefined already done before via checkArgument
        return this.consumers.get(queue);
    }

    public getProducer(queue: JsmsMessageQueue): JsmsMessageProducer {
        checkArgument(this.producers.has(queue));
        // @ts-ignore: check for undefined already done before via checkArgument
        return this.producers.get(queue);
    }
}