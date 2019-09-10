import { JsmsConnection } from "@/jsms-connection";
import { JsmsMessageQueue } from "@/jsms-message-queue";
import { FakeMessageConsumer } from "./fake-message-consumer";
import { FakeMessageProducer } from "./fake-message-producer";

export class FakeConnection extends JsmsConnection {
        
    public createQueue(queueName: string): JsmsMessageQueue {
        const queue = new JsmsMessageQueue(queueName);
        const producer = new FakeMessageProducer(this, queue);
        const consumer = new FakeMessageConsumer(this, queue)

        super.addQueue(queue, producer, consumer);
        
        return queue;
    }
}