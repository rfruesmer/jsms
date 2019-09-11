import { JsMessageProducer } from "@/js-message-producer";
import { JsmsConnection } from "@/jsms-connection";
import { JsmsDestination } from "@/jsms-destination";
import { JsmsMessage } from "@/jsms-message";


export class FakeMessageProducer extends JsMessageProducer {
    private lastMessage!: JsmsMessage;
    
    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection,  destination);
    }
    
    public send(message: JsmsMessage): Promise<JsmsMessage> {
        this.lastMessage = message;

        // NOTE: a custom message producer can do custom things with the message now 

        // TODO: check if test still works when not dispatching to super classer
        return super.send(message);
    }

    public getLastMessage(): JsmsMessage {
        return this.lastMessage;
    }
}