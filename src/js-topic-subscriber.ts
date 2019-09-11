import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageConsumer } from "./jsms-message-consumer";
import { JsmsTopic } from "./jsms-topic";

export class JsTopicSubscriber extends JsmsMessageConsumer {
    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public receive(): JsmsDeferred<JsmsMessage, object, Error> {
        return this.receiveTopicMessage();
    }

    private receiveTopicMessage(): JsmsDeferred<JsmsMessage, object, Error> {
        const receiver = new JsmsDeferred<JsmsMessage, object, Error>();
        const topic = this.getDestination() as JsmsTopic;
        topic.subscribe((message: JsmsMessage) => {
            receiver.resolve(message);
        });

        return receiver;
    }

    public onMessage(message: JsmsMessage, sender: JsmsDeferred<JsmsMessage, object, Error>): boolean {
        return this.sendToTopic(message);
    }

    private sendToTopic(message: JsmsMessage): boolean {
        let result = true;
        const topic = this.getDestination() as JsmsTopic;
        topic.getSubscribers().forEach(subscriber => {
            try {
                subscriber(message)
            }
            catch (e) {
                console.error(e);
                result = false;
            }
        });

        return result;
    }
}