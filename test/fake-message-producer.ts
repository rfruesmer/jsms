import { JsmsMessageProducer } from "@/jsms-message-producer";
import { JsmsMessage } from "@/jsms-message";
import { JsmsConnection } from "@/jsms-connection";
import { JsmsDestination } from "@/jsms-destination";


export class FakeMessageProducer implements JsmsMessageProducer {
    private connection: JsmsConnection;
    private destination: any;
    private lastMessage!: JsmsMessage;
    
    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        this.connection = connection;
        this.destination = destination;
    }
    
    public send(message: JsmsMessage): Promise<JsmsMessage> {
        this.lastMessage = message;
        const promise = new Promise<JsmsMessage>((resolve, reject) => {
            resolve();
        });

        return promise;
    }

    public getLastMessage(): JsmsMessage {
        return this.lastMessage;
    }
}