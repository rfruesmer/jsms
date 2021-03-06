import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";

/**
 *  A client uses a MessageProducer object to send messages to a destination.
 */
export abstract class JsmsMessageProducer {
    private destination: JsmsDestination;

    constructor(destination: JsmsDestination) {
        this.destination = destination;
    }

    protected getDestination(): JsmsDestination {
        return this.destination;
    }

    /**
     *  @param   message The message to send
     * 
     *  @returns For PTP messaging: a deferred promise that represents the 
     *           response if the listener replies to this message. If the 
     *           message is invalid (e.g. expired) the promise will be rejected.
     *           For pub/sub messaging: a deferred promise that represents the 
     *           original message - it will be resolved as soon as the message
     *           has been sent to all subscribers.
     * 
     *  @throws  Error if the JSMS provider fails to send the message due 
     *           to some internal error, e. g. the connection isn't available
     */
    public abstract send(message: JsmsMessage): JsmsDeferred<JsmsMessage>;
}
