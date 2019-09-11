import { JsmsConnection } from "@/jsms-connection";
import { JsmsQueue } from "@/jsms-queue";
import { FakeMessageConsumer } from "./fake-message-consumer";
import { FakeMessageProducer } from "./fake-message-producer";
import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageHeader } from "@/jsms-message-header";
import { v4 } from "uuid";

export class FakeConnection extends JsmsConnection {
    private queue!: JsmsQueue;
    private consumer!: FakeMessageConsumer;
    private producer!: FakeMessageProducer;
        
    public createQueue(queueName: string): JsmsQueue {
        this.queue = new JsmsQueue(queueName);
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