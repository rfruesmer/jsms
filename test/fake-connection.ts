import { JsmsConnection } from "@/jsms-connection";
import { JsmsDeferred } from "@/jsms-deferred";
import { JsmsDestination } from "@/jsms-destination";
import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageConsumer } from "@/jsms-message-consumer";
import { JsmsMessageProducer } from "@/jsms-message-producer";
import { JsmsQueue } from "@/jsms-queue";
import { JsmsTopic } from "@/jsms-topic";
import { FakeCustomMessage } from "./fake-custom-message";
import { FakeMessageConsumer } from "./fake-message-consumer";
import { FakeMessageProducer } from "./fake-message-producer";

export class FakeConnection extends JsmsConnection {
        
    public createQueue(queueName: string): JsmsQueue {
        const queue = new JsmsQueue(queueName);
        super.addQueue(queue, this.createProducer(queue), this.createConsumer(queue));
        
        return queue;
    }

    protected createProducer(destination: JsmsDestination): JsmsMessageProducer {
        return new FakeMessageProducer(this, destination);
    }

    protected createConsumer(destination: JsmsDestination): JsmsMessageConsumer {
        return new FakeMessageConsumer(this, destination);
    }

    public onCustomMessageReceived(customMessage: FakeCustomMessage): boolean {
        const destination = super.getDestinationFor(customMessage.id);
        const consumer = super.getConsumer(destination) as FakeMessageConsumer;
        const message = JsmsMessage.create(destination.getName(), customMessage.data);
        const responseDeferred = new JsmsDeferred<JsmsMessage, object, Error>();

        return consumer.onMessage(message, responseDeferred);
    }

    public createTopic(topicName: string): JsmsTopic {
        const topic = new JsmsTopic(topicName);
        super.addTopic(topic, this.createProducer(topic), this.createConsumer(topic));
        
        return topic;
    }
}