import { JsmsConnection } from "./jsms-connection";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsDeferred } from "./jsms-deferred";

/**
 *  A client uses a MessageProducer object to send messages to a destination.
 */
export abstract class JsmsMessageProducer {
    private connection: JsmsConnection;
    private destination: JsmsDestination;

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        this.connection = connection;
        this.destination = destination;
    }

    protected getConnection(): JsmsConnection {
        return this.connection;
    }

    protected getDestination(): JsmsDestination {
        return this.destination;
    }

    /**
     * @param  {JsmsMessage} message The message to send
     * @returns For PTP messaging: a deferred promise that represents the 
     *          response if the listener replies to this message. If the 
     *          message is invalid (e.g. expired) the promise will be rejected.
     * 
     *          For pub/sub messaging: a deferred promise that represents the 
     *          original message - it will be resolved as soon as the message
     *          has been sent to all subscribers.
     */
    public abstract send(message: JsmsMessage): JsmsDeferred<JsmsMessage>;
}
