import { MessageQueue } from "./message-queue";
import { Message } from "./message";

/**
 *  A message producer is responsible for implementing a specific
 *  transport mechanism like HTTP, Web Socket etc.
 */
export interface MessageProducer {
    
    /**
     * @param  {Message} message The message to send
     * @returns Promise represents the response if the listener replies to this message, 
     *                  otherwise undefined.
     */
    send(message: Message): Promise<Message>
}