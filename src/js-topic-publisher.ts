import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageProducer } from "./jsms-message-producer";
import { JsmsTopic } from "./jsms-topic";

export class JsTopicPublisher extends JsmsMessageProducer {
    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public send(message: JsmsMessage): Promise<JsmsMessage> {
        const deferred = new JsmsDeferred<JsmsMessage, object, Error>();

        this.sendToTopic(message, deferred);

        return deferred.promise;
    }

    private sendToTopic(message: JsmsMessage, deferred: JsmsDeferred<JsmsMessage, object, Error>): void {
        const topic = this.getDestination() as JsmsTopic;
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
}