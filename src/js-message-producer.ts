import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageProducer } from "@/jsms-message-producer";
import { JsmsConnection } from "./jsms-connection";
import { JsmsDestination } from "./jsms-destination";
import { JsmsTopic } from "./jsms-topic";
import { JsmsQueue } from "./jsms-queue";
import { JsmsDeferred } from "./jsms-deferred";


export class JsMessageProducer extends JsmsMessageProducer {

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public send(message: JsmsMessage): Promise<JsmsMessage> {
        const deferred = new JsmsDeferred<JsmsMessage, object, Error>();
        
        if (this.destination instanceof JsmsTopic) {
            this.publish(message);
            deferred.resolve(message); // TODO: this is inconsistent against queue behavior
        }
        else {
            // since this an in-process producer, it can directly dispatch to the consumer
            const consumer = this.connection.getConsumer(this.destination);
            if (!consumer.onMessage(message, deferred)) {
                const queue = this.destination as JsmsQueue;
                queue.enqueue(message);
            }
        }

        return deferred.promise;
    }
    
    private publish(message: JsmsMessage): void {
        const topic = this.destination as JsmsTopic;
        topic.getSubscribers().forEach(subscriber => {
            try {
                subscriber(message);
            }
            catch (error) {
                console.error(error);
            }
        });
    }
}