import { JsMessageConsumer } from "./js-message-consumer";
import { JsMessageProducer } from "./js-message-producer";
import { JsmsConnection } from "./jsms-connection";
import { JsmsQueue } from "./jsms-queue";
import { JsmsTopic } from "./jsms-topic";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessageProducer } from "./jsms-message-producer";
import { JsmsMessageConsumer } from "./jsms-message-consumer";

export class JsConnection extends JsmsConnection {

    public createQueue(queueName: string): JsmsQueue {
        const queue = new JsmsQueue(queueName);
        super.addQueue(queue, this.createProducer(queue), this.createConsumer(queue));

        return queue;
    }
    
    protected createProducer(destination: JsmsDestination): JsmsMessageProducer {
        return new JsMessageProducer(this, destination);
    }

    protected createConsumer(destination: JsmsDestination): JsmsMessageConsumer {
        return new JsMessageConsumer(this, destination);
    }

    public createTopic(topicName: string): JsmsTopic {
        const topic = new JsmsTopic(topicName);
        super.addTopic(topic, this.createProducer(topic), this.createConsumer(topic));

        return topic;
    }
}