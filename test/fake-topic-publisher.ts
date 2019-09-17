import { JsmsDeferred } from "../src/jsms-deferred";
import { JsmsMessage } from "../src/jsms-message";
import { JsmsTopicPublisher } from "../src/jsms-topic-publisher";

export class FakeTopicPublisher extends JsmsTopicPublisher {
    private lastMessage!: JsmsMessage;

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        this.lastMessage = message;
        return super.send(message);
    }

    public getLastMessage(): JsmsMessage {
        return this.lastMessage;
    }
}