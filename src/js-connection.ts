import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsMessage } from "./jsms-message";
import { JsmsQueue } from "./jsms-queue";
import { JsmsQueueReceiver } from "./jsms-queue-receiver";
import { JsmsQueueSender } from "./jsms-queue-sender";
import { JsmsTopic } from "./jsms-topic";
import { JsmsTopicPublisher } from "./jsms-topic-publisher";
import { JsmsTopicSubscriber } from "./jsms-topic-subscriber";

/**
 * The JsConnection allows clients to connect to each other inside the 
 * JavaScript environment without the overhead of network communication. 
 */
export class JsConnection extends JsmsConnection {

    public createQueue(queueName: string): JsmsQueue {
        const queue = new JsmsQueue(queueName);
        this.addQueue(queue, new JsmsQueueSender(this, queue), new JsmsQueueReceiver(queue));
        return queue;
    }

    public createTopic(topicName: string): JsmsTopic {
        const topic = new JsmsTopic(topicName);
        this.addTopic(topic, new JsmsTopicPublisher(topic), new JsmsTopicSubscriber(topic));
        return topic;
    }

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        const queue = this.getDestinationFor(message.header.destination);
        const consumer = this.getConsumer(queue);

        return consumer.onMessage(message);
    }
}
