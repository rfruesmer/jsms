import { JsmsMessageQueue } from "./jsms-message-queue";
import { JsmsMessage } from "./jsms-message";
import { JsmsDeferred } from "./jsms-deferred";

/**
 *  A message consumer is responsible for implementing a specific transport 
 *  mechanism like HTTP, Web Socket etc.
 */
export interface JsmsMessageConsumer {
    /**
     *  Receives the next message produced for this message consumer.
     */
    receive(): JsmsDeferred<JsmsMessage, object, Error>;
}