import { JsQueueReceiver } from "@/internal/js-queue-receiver";
import { JsTopicSubscriber } from "@/internal/js-topic-subscriber";
import { JsmsConnection } from "@/jsms-connection";
import { JsmsDeferred } from "@/jsms-deferred";
import { JsmsMessage } from "@/jsms-message";
import { JsmsQueue } from "@/jsms-queue";
import { JsmsTopic } from "@/jsms-topic";
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
        super.addQueue(queue, new FakeQueueSender(this, queue), new JsQueueReceiver(this, queue));
        
        return queue;
    }

    public createTopic(topicName: string): JsmsTopic {
        const topic = new JsmsTopic(topicName);
        super.addTopic(topic, new FakeTopicPublisher(this, topic), new JsTopicSubscriber(this, topic));
        
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
            this.lastQueueName = message.header.channel;
            throw new Error("connection unavailable");
        }

        const destination = super.getDestinationFor(message.header.channel);
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
