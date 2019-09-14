import { JsmsDeferred } from "./jsms-deferred";
import { JsmsMessage } from "./jsms-message";

/**
 * A MessageListener object is used to receive asynchronously delivered messages.
 */
export interface JsmsMessageListener {
    /**
     * Passes a message to the listener.
     *
     * @param message the message passed to the listener
     * @returns A deferred promise for the response. If the message isn't valid
     *          (e.g. expired) the promise will be rejected.
     */
    onMessage(message: JsmsMessage): JsmsDeferred<JsmsMessage>;
}
