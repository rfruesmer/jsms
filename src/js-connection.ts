import { Connection } from "./connection";
import { MessageQueue } from "./message-queue";
import { JsMessageProducer } from "./js-message-producer";
import { JsMessageConsumer } from "./js-message-consumer";

export class JsConnection extends Connection {

    public createQueue(queueName: string): MessageQueue {
        const queue = new MessageQueue(queueName);
        const producer = new JsMessageProducer(this, queue);
        const consumer = new JsMessageConsumer(this, queue);

        super.addQueue(queue, producer, consumer);
        
        return queue;
   }
}