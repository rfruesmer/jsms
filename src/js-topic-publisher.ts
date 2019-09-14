import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageProducer } from "./jsms-message-producer";
import { JsmsTopic } from "./jsms-topic";
import { getLogger } from "@log4js-node/log4js-api";

export class JsTopicPublisher extends JsmsMessageProducer {
    private logger = getLogger("jsms");
    
    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        const deferred = new JsmsDeferred<JsmsMessage>();

        this.sendToTopic(message, deferred);

        return deferred;
    }

    private sendToTopic(message: JsmsMessage, deferred: JsmsDeferred<JsmsMessage>): void {
        const topic = this.getDestination() as JsmsTopic;
        topic.getSubscribers().forEach(subscriber => {
            try {
                subscriber(message);
            } 
            catch (error) {
                this.logger.error(error);
            }
        });
        
        deferred.resolve(message);
    }
}