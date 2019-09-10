import { JsmsMessageQueue } from "./jsms-message-queue";
import { JsmsMessage } from "./jsms-message";

/**
 *  A message producer is responsible for implementing a specific
 *  transport mechanism like HTTP, Web Socket etc.
 */
export interface JsmsMessageProducer {
    
    /**
     * @param  {JsmsMessage} message The message to send
     * @returns Promise represents the response if the listener replies to this message, 
     *                  otherwise undefined.
     */
    send(message: JsmsMessage): Promise<JsmsMessage>
}