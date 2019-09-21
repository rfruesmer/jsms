import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageProducer } from "./jsms-message-producer";

export class JsmsQueueSender extends JsmsMessageProducer {
    private _connection: JsmsConnection;

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(destination);

        this._connection = connection;
    }

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        return this._connection.send(message);
    }

    public get connection(): JsmsConnection {
        return this._connection;
    }
}