import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageConsumer } from "./jsms-message-consumer";
import { JsmsTopic } from "./jsms-topic";
import { getLogger } from "@log4js-node/log4js-api";

export class JsTopicSubscriber extends JsmsMessageConsumer {
    private logger = getLogger("jsms");

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public receive(): JsmsDeferred<JsmsMessage> {
        return this.receiveTopicMessage();
    }

    private receiveTopicMessage(): JsmsDeferred<JsmsMessage> {
        const receiver = new JsmsDeferred<JsmsMessage>();
        const topic = this.getDestination() as JsmsTopic;
        topic.subscribe((message: JsmsMessage) => {
            receiver.resolve(message);
        });

        return receiver;
    }

    public onMessage(message: JsmsMessage, sender: JsmsDeferred<JsmsMessage>): boolean {
        return this.sendToTopic(message);
    }

    private sendToTopic(message: JsmsMessage): boolean {
        let result = true;
        const topic = this.getDestination() as JsmsTopic;
        topic.getSubscribers().forEach(subscriber => {
            try {
                subscriber(message);
            }
            catch (e) {
                this.logger.error(e);
                result = false;
            }
        });

        return result;
    }
}