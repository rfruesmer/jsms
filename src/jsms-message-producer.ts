import { JsmsQueue } from "./jsms-queue";
import { JsmsMessage } from "./jsms-message";

/**
 *  A client uses a MessageProducer object to send messages to a destination.
 */
export interface JsmsMessageProducer {
    
    /**
     * @param  {JsmsMessage} message The message to send
     * @returns Promise represents the response if the listener replies to this message, otherwise undefined.
     */
    send(message: JsmsMessage): Promise<JsmsMessage>
}