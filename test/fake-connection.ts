import { JsmsConnection } from "../src/jsms-connection";
import { JsmsDeferred } from "../src/jsms-deferred";
import { JsmsMessage } from "../src/jsms-message";
import { JsmsQueue } from "../src/jsms-queue";
import { JsmsQueueReceiver } from "../src/jsms-queue-receiver";
import { JsmsTopic } from "../src/jsms-topic";
import { JsmsTopicSubscriber } from "../src/jsms-topic-subscriber";
import { FakeCustomMessage } from "./fake-custom-message";
import { FakeQueueSender } from "./fake-queue-sender";
import { FakeTopicPublisher } from "./fake-topic-publisher";


export class FakeConnection extends JsmsConnection {
    private available = true;
    private availabilityTimer: any;
    private lastSentMessage!: JsmsMessage;
    private lastQueueName = "";

    public createQueue(queueName: string): JsmsQueue {
        const queue = new JsmsQueue(queueName);
        super.addQueue(queue, new FakeQueueSender(this, queue), new JsmsQueueReceiver(this, queue));
        
        return queue;
    }

    public createTopic(topicName: string): JsmsTopic {
        const topic = new JsmsTopic(topicName);
        super.addTopic(topic, new FakeTopicPublisher(this, topic), new JsmsTopicSubscriber(this, topic));
        
        return topic;
    }

    public onCustomMessageReceived(customMessage: FakeCustomMessage): JsmsDeferred<JsmsMessage> {
        const destination = super.getDestinationFor(customMessage.id);
        const consumer = super.getConsumer(destination);
        const message = JsmsMessage.create(destination.getName(), customMessage.data);

        return consumer.onMessage(message);
    }

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        this.lastSentMessage = message;

        if (!this.available) {
            this.lastQueueName = message.header.destination;
            throw new Error("connection unavailable");
        }

        const destination = super.getDestinationFor(message.header.destination);
        const consumer = super.getConsumer(destination);
        return consumer.onMessage(message);
    }

    public getLastSentMessage(): JsmsMessage {
        return this.lastSentMessage;
    }

    public simulateDelayedAvailability(durationMillis: number): void {
        this.available = false;
        this.availabilityTimer = setTimeout(() => {
            this.available = true;
            const consumer = this.getConsumer(this.getDestinationFor(this.lastQueueName));
            consumer.receive()
                .then((message: JsmsMessage) => {
                    return { response: "PONG" };
                }); 
        }, durationMillis);
    }

    public close(): void {
        super.close();

        clearTimeout(this.availabilityTimer);
    }
}
