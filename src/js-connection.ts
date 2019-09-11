import { JsMessageConsumer } from "./js-message-consumer";
import { JsMessageProducer } from "./js-message-producer";
import { JsmsConnection } from "./jsms-connection";
import { JsmsQueue } from "./jsms-queue";
import { JsmsTopic } from "./jsms-topic";

export class JsConnection extends JsmsConnection {

    public createQueue(queueName: string): JsmsQueue {
        const queue = new JsmsQueue(queueName);
        const producer = new JsMessageProducer(this, queue);
        const consumer = new JsMessageConsumer(this, queue);

        super.addQueue(queue, producer, consumer);

        return queue;
    }

    public createTopic(topicName: string): JsmsTopic {
        const topic = new JsmsTopic(topicName);
        const producer = new JsMessageProducer(this, topic);
        const consumer = new JsMessageConsumer(this, topic);

        super.addTopic(topic, producer, consumer);

        return topic;
    }
}