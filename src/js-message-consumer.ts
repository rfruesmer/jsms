import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageConsumer } from "@/jsms-message-consumer";
import { JsmsDeferred } from "@/jsms-deferred";
import { JsmsConnection } from "./jsms-connection";
import { JsmsDestination } from "./jsms-destination";


export class JsMessageConsumer implements JsmsMessageConsumer {
    private connection: JsmsConnection;
    private destination: JsmsDestination;

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        this.connection = connection;
        this.destination = destination;
    }

    public receive(): JsmsDeferred<JsmsMessage, object, Error> {
        return this.destination.receive();
    }
}