import { JsmsConnection } from "./jsms-connection";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";

/**
 *  A client uses a MessageProducer object to send messages to a destination.
 */
export abstract class JsmsMessageProducer {
    // TODO: check if we can make members private by providing getters
    protected connection: JsmsConnection;
    protected destination: JsmsDestination;

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        this.connection = connection;
        this.destination = destination;
    }

    /**
     * @param  {JsmsMessage} message The message to send
     * @returns Promise represents the response if the listener replies to this message, otherwise undefined.
     */
    public abstract send(message: JsmsMessage): Promise<JsmsMessage>
}