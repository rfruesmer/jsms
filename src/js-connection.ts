import { JsmsConnection } from "./jsms-connection";
import { JsmsMessageQueue } from "./jsms-message-queue";
import { JsMessageProducer } from "./js-message-producer";
import { JsMessageConsumer } from "./js-message-consumer";

export class JsConnection extends JsmsConnection {

    public createQueue(queueName: string): JsmsMessageQueue {
        const queue = new JsmsMessageQueue(queueName);
        const producer = new JsMessageProducer(this, queue);
        const consumer = new JsMessageConsumer(this, queue);

        super.addQueue(queue, producer, consumer);
        
        return queue;
   }
}