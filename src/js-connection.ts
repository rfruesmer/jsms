import { JsQueueReceiver } from "./js-queue-receiver";
import { JsQueueSender } from "./js-queue-sender";
import { JsTopicPublisher } from "./js-topic-publisher";
import { JsTopicSubscriber } from "./js-topic-subscriber";
import { JsmsConnection } from "./jsms-connection";
import { JsmsQueue } from "./jsms-queue";
import { JsmsTopic } from "./jsms-topic";

/**
 * The JsConnection allows clients to connect to each other inside the 
 * JavaScript environment without the overhead of network communication. 
 */
export class JsConnection extends JsmsConnection {
    public createQueue(queueName: string): JsmsQueue {
        const queue = new JsmsQueue(queueName);
        super.addQueue(queue, new JsQueueSender(this, queue), new JsQueueReceiver(this, queue));
        return queue;
    }

    public createTopic(topicName: string): JsmsTopic {
        const topic = new JsmsTopic(topicName);
        super.addTopic(topic, new JsTopicPublisher(this, topic), new JsTopicSubscriber(this, topic));
        return topic;
    }
}
