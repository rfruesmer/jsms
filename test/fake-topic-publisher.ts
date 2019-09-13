import { JsTopicPublisher } from "@/js-topic-publisher";
import { JsmsMessage } from "@/jsms-message";

export class FakeTopicPublisher extends JsTopicPublisher {
    private lastMessage!: JsmsMessage;

    public send(message: JsmsMessage): Promise<object> {
        this.lastMessage = message;

        // NOTE: a custom message producer isn't limited to calling super, 
        // but can do custom things with the message now

        return super.send(message);
    }

    public getLastMessage(): JsmsMessage {
        return this.lastMessage;
    }
}