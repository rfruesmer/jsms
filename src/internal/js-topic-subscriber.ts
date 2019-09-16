import { JsmsConnection } from "../jsms-connection";
import { JsmsDeferred } from "../jsms-deferred";
import { JsmsDestination } from "../jsms-destination";
import { JsmsMessage } from "../jsms-message";
import { JsmsMessageConsumer } from "../jsms-message-consumer";
import { JsmsTopic } from "../jsms-topic";

export class JsTopicSubscriber extends JsmsMessageConsumer {
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

    public onMessage(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        this.sendToTopic(message);

        const deferred = new JsmsDeferred<JsmsMessage>();
        deferred.resolve(message);
        return deferred;
    }

    private sendToTopic(message: JsmsMessage): void {
        const topic = this.getDestination() as JsmsTopic;
        topic.getSubscribers().forEach(subscriber => {
            subscriber(message);
        });
    }
}