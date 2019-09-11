import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsMessage } from "./jsms-message";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessageListener } from "./jsms-message-listener";

/**
 * A client uses a MessageConsumer object to receive messages from a destination.
 */
// TODO: check if it's necessary to extend the message listener here
export abstract class JsmsMessageConsumer implements JsmsMessageListener {
    // TODO: check if we can make members private by providing getters
    protected connection: JsmsConnection;
    protected destination: JsmsDestination;

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        this.connection = connection;
        this.destination = destination;
    }

    /**
     * Receives the next message produced for this message consumer.
     *
     * This call is run asynchronuos and therefore doesn't block.
     */
    public abstract receive(): JsmsDeferred<JsmsMessage, object, Error>;

    public abstract onMessage(
        message: JsmsMessage,
        responseDeferred: JsmsDeferred<JsmsMessage, object, Error>
    ): boolean;
}
