import { JsmsConnection } from "@/jsms-connection";
import { JsmsQueue } from "@/jsms-queue";
import { FakeMessageConsumer } from "./fake-message-consumer";
import { FakeMessageProducer } from "./fake-message-producer";
import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageHeader } from "@/jsms-message-header";
import { v4 } from "uuid";
import { JsmsTopic } from "@/jsms-topic";
import { FakeCustomMessage } from "./fake-custom-message";

export class FakeConnection extends JsmsConnection {
        
    public createQueue(queueName: string): JsmsQueue {
        const queue = new JsmsQueue(queueName);
        const producer = new FakeMessageProducer(this, queue);
        const consumer = new FakeMessageConsumer(this, queue)

        super.addQueue(queue, producer, consumer);
        
        return queue;
    }

    public onCustomMessageReceived(customMessage: FakeCustomMessage): void {
        const destination = super.getDestinationFor(customMessage.id);
        if (!destination) {
            console.warn("Received unknown message: " + customMessage.id)
            return;
        }
        
        const consumer = super.getConsumer(destination) as FakeMessageConsumer;
        const message = new JsmsMessage(new JsmsMessageHeader(destination.getName(), v4(), 0), customMessage.data);
        consumer.onMessage(message);
    }

    public createTopic(topicName: string): JsmsTopic {
        const topic = new JsmsTopic(topicName);
        const producer = new FakeMessageProducer(this, topic);
        const consumer = new FakeMessageConsumer(this, topic)

        super.addTopic(topic, producer, consumer);
        
        return topic;
    }
}