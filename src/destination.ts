import { Deferred } from "./deferred";
import { Message } from "./message";

export interface Destination {
    // TODO: consider delegating to connection
    send(message: Message): Promise<Message>;
    receive(): Deferred<Message, object, Error>;
}