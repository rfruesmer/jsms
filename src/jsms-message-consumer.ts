import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageListener } from "./jsms-message-listener";

/**
 *  A client uses a MessageConsumer object to receive messages from a destination.
 */
export abstract class JsmsMessageConsumer implements JsmsMessageListener {
    private destination: JsmsDestination;

    constructor(destination: JsmsDestination) {
        this.destination = destination;
    }

    protected getDestination(): JsmsDestination {
        return this.destination;
    }

    /**
     *  Receives the next message produced for this message consumer.
     *
     *  This call is run asynchronuos and therefore doesn't block.
     */
    public abstract receive(): JsmsDeferred<JsmsMessage>;

    /**
     *  Dispatches the given message to attached listeners.
     */
    public abstract onMessage(message: JsmsMessage): JsmsDeferred<JsmsMessage>;
}
