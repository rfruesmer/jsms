import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageProducer } from "@/jsms-message-producer";
import { JsmsConnection } from "./jsms-connection";
import { JsmsDestination } from "./jsms-destination";


export class JsMessageProducer implements JsmsMessageProducer {
    private connection: JsmsConnection;
    private destination: JsmsDestination;

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        this.connection = connection;
        this.destination = destination;
    }

    public send(message: JsmsMessage): Promise<JsmsMessage> {
        return this.destination.send(message);
    }
}