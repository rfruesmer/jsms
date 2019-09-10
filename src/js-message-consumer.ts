import { Message } from "@/message";
import { MessageConsumer } from "@/message-consumer";
import { Deferred } from "@/deferred";
import { Connection } from "./connection";
import { Destination } from "./destination";


export class JsMessageConsumer implements MessageConsumer {
    private connection: Connection;
    private destination: Destination;

    constructor(connection: Connection, destination: Destination) {
        this.connection = connection;
        this.destination = destination;
    }

    public receive(): Deferred<Message, object, Error> {
        return this.destination.receive();
    }
}