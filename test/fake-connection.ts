import { JsQueueReceiver } from "@/js-queue-receiver";
import { JsTopicSubscriber } from "@/js-topic-subscriber";
import { JsmsConnection } from "@/jsms-connection";
import { JsmsDeferred } from "@/jsms-deferred";
import { JsmsMessage } from "@/jsms-message";
import { JsmsQueue } from "@/jsms-queue";
import { JsmsTopic } from "@/jsms-topic";
import { FakeCustomMessage } from "./fake-custom-message";
import { FakeQueueSender } from "./fake-queue-sender";
import { FakeTopicPublisher } from "./fake-topic-publisher";

export class FakeConnection extends JsmsConnection {
    private lastSentMessage!: JsmsMessage;

    public createQueue(queueName: string): JsmsQueue {
        const queue = new JsmsQueue(queueName);
        super.addQueue(queue, new FakeQueueSender(this, queue), new JsQueueReceiver(this, queue));
        
        return queue;
    }

    public createTopic(topicName: string): JsmsTopic {
        const topic = new JsmsTopic(topicName);
        super.addTopic(topic, new FakeTopicPublisher(this, topic), new JsTopicSubscriber(this, topic));
        
        return topic;
    }

    public onCustomMessageReceived(customMessage: FakeCustomMessage): boolean {
        const destination = super.getDestinationFor(customMessage.id);
        const consumer = super.getConsumer(destination);
        const message = JsmsMessage.create(destination.getName(), customMessage.data);
        const responseDeferred = new JsmsDeferred<object>();

        return consumer.onMessage(message, responseDeferred);
    }

    public send(message: JsmsMessage): void {
        this.lastSentMessage = message;
    }

    public getLastSentMessage(): JsmsMessage {
        return this.lastSentMessage;
    }
}
