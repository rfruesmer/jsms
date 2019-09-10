import { MessageQueue } from "./message-queue";
import { Message } from "./message";
import { Deferred } from "./deferred";

/**
 *  A message consumer is responsible for implementing a specific transport 
 *  mechanism like HTTP, Web Socket etc.
 */
export interface MessageConsumer {
    /**
     *  Receives the next message produced for this message consumer.
     */
    receive(): Deferred<Message, object, Error>;
}