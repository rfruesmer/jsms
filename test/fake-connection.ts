import { Connection } from "@/connection";
import { MessageQueue } from "@/message-queue";
import { FakeMessageConsumer } from "./fake-message-consumer";
import { FakeMessageProducer } from "./fake-message-producer";

export class FakeConnection extends Connection {
        
    public createQueue(queueName: string): MessageQueue {
        const queue = new MessageQueue(queueName);
        const producer = new FakeMessageProducer(this, queue);
        const consumer = new FakeMessageConsumer(this, queue)

        super.addQueue(queue, producer, consumer);
        
        return queue;
    }
}