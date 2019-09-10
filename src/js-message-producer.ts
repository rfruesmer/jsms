import { Message } from "@/message";
import { MessageProducer } from "@/message-producer";
import { Connection } from "./connection";
import { Destination } from "./destination";


export class JsMessageProducer implements MessageProducer {
    private connection: Connection;
    private destination: Destination;

    constructor(connection: Connection, destination: Destination) {
        this.connection = connection;
        this.destination = destination;
    }

    public send(message: Message): Promise<Message> {
        return this.destination.send(message);
    }
}