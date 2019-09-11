import { JsQueueSender } from "@/js-queue-sender";
import { JsmsMessage } from "@/jsms-message";

export class FakeQueueSender extends JsQueueSender {
    private lastMessage!: JsmsMessage;

    public send(message: JsmsMessage): Promise<JsmsMessage> {
        this.lastMessage = message;

        // NOTE: a custom message producer isn't limited to calling super, 
        // but can do custom things with the message now

        return super.send(message);
    }

    public getLastMessage(): JsmsMessage {
        return this.lastMessage;
    }
}