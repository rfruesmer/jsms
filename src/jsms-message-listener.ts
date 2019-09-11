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
     */
    onMessage(message: JsmsMessage, responseDeferred: JsmsDeferred<JsmsMessage, object, Error>): boolean;
}
