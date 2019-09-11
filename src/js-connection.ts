import { JsmsConnection } from "./jsms-connection";
import { JsmsQueue } from "./jsms-queue";
import { JsMessageProducer } from "./js-message-producer";
import { JsMessageConsumer } from "./js-message-consumer";

export class JsConnection extends JsmsConnection {

    public createQueue(queueName: string): JsmsQueue {
        const queue = new JsmsQueue(queueName);
        const producer = new JsMessageProducer(this, queue);
        const consumer = new JsMessageConsumer(this, queue);

        super.addQueue(queue, producer, consumer);
        
        return queue;
   }
}