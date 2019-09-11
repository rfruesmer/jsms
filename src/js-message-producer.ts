import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageProducer } from "@/jsms-message-producer";
import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsQueue } from "./jsms-queue";
import { JsmsTopic } from "./jsms-topic";

export class JsMessageProducer extends JsmsMessageProducer {
    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public send(message: JsmsMessage): Promise<JsmsMessage> {
        const deferred = new JsmsDeferred<JsmsMessage, object, Error>();
        if (this.destination instanceof JsmsTopic) {
            this.sendToTopic(message, deferred);
        } 
        else {
            this.sendToQueue(message, deferred);
        }

        return deferred.promise;
    }

    private sendToTopic(message: JsmsMessage, deferred: JsmsDeferred<JsmsMessage, object, Error>): void {
        const topic = this.destination as JsmsTopic;
        topic.getSubscribers().forEach(subscriber => {
            try {
                subscriber(message);
            } 
            catch (error) {
                console.error(error);
            }
        });
        
        deferred.resolve(message);
    }

    private sendToQueue(message: JsmsMessage, deferred: JsmsDeferred<JsmsMessage, object, Error>): void {
        // since this an in-process producer, it can directly dispatch to the consumer
        const consumer = this.connection.getConsumer(this.destination);
        if (!consumer.onMessage(message, deferred)) {
            const queue = this.destination as JsmsQueue;
            queue.enqueue(message);
        }
    }
}
