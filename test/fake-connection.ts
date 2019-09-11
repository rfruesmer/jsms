import { JsmsConnection } from "@/jsms-connection";
import { JsmsMessageQueue } from "@/jsms-message-queue";
import { FakeMessageConsumer } from "./fake-message-consumer";
import { FakeMessageProducer } from "./fake-message-producer";
import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageHeader } from "@/jsms-message-header";
import { v4 } from "uuid";

export class FakeConnection extends JsmsConnection {
    private queue!: JsmsMessageQueue;
    private consumer!: FakeMessageConsumer;
    private producer!: FakeMessageProducer;
        
    public createQueue(queueName: string): JsmsMessageQueue {
        this.queue = new JsmsMessageQueue(queueName);
        this.producer = new FakeMessageProducer(this, this.queue);
        this.consumer = new FakeMessageConsumer(this, this.queue)

        super.addQueue(this.queue, this.producer, this.consumer);
        
        return this.queue;
    }

    public onDataReceived(data: object): void {
        const message = new JsmsMessage(new JsmsMessageHeader(this.queue.getName(), v4(), 0));
        this.consumer.onMessage(message);
    }
}