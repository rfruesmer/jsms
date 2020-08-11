import { getLogger } from "@log4js-node/log4js-api";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageProducer } from "./jsms-message-producer";
import { JsmsTopic } from "./jsms-topic";

export class JsmsTopicPublisher extends JsmsMessageProducer {
    private logger = getLogger("jsms");
    
    constructor(destination: JsmsDestination) {
        super(destination);
    }

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        const deferred = new JsmsDeferred<JsmsMessage>();

        this.sendToTopic(message, deferred);

        return deferred;
    }

    private sendToTopic(message: JsmsMessage, deferred: JsmsDeferred<JsmsMessage>): void {
        const errors: any = [];
        const topic = this.getDestination() as JsmsTopic;
        topic.getSubscribers().forEach(subscriber => {
            try {
                subscriber(message);
            } 
            catch (error) {
                this.logger.error(error);
                errors.push(error);
            }
        });

        if (errors.length === 0) {
            deferred.resolve(message);
        }
        else {
            deferred.reject(errors);
        }
    }
}