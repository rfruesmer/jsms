import { JsmsMessageQueue } from "./jsms-message-queue";
import { JsmsMessage } from "./jsms-message";
import { JsmsDeferred } from "./jsms-deferred";

/**
 * A client uses a MessageConsumer object to receive messages from a destination. 
 */
export interface JsmsMessageConsumer {
    /**
     * Receives the next message produced for this message consumer.
     * 
     * This call is run asynchronuos and therefore doesn't block.
     */
    receive(): JsmsDeferred<JsmsMessage, object, Error>;
}