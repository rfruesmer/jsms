import { Destination } from "./destination";
import { MessageConsumer } from "./message-consumer";
import { MessageProducer } from "./message-producer";
import { MessageQueue } from "./message-queue";
import { checkArgument, checkState } from "./preconditions";


export abstract class Connection {
    protected queues = new Map<string, MessageQueue>();
    protected producers = new Map<MessageQueue, MessageProducer>();
    protected consumers = new Map<MessageQueue, MessageConsumer>();

    public abstract createQueue(queueName: string): MessageQueue;

    protected addQueue(queue: MessageQueue, producer: MessageProducer, consumer: MessageConsumer): void {
        checkState(!this.queues.has(queue.getName()), "A queue with the same name is already registered");

        this.queues.set(queue.getName(), queue);
        this.producers.set(queue, producer);
        this.consumers.set(queue, consumer);
    }

    public getConsumer(queue: MessageQueue): MessageConsumer {
        checkArgument(this.consumers.has(queue));
        // @ts-ignore: check for undefined already done before via checkArgument
        return this.consumers.get(queue);
    }

    public getProducer(queue: MessageQueue): MessageProducer {
        checkArgument(this.producers.has(queue));
        // @ts-ignore: check for undefined already done before via checkArgument
        return this.producers.get(queue);
    }
}