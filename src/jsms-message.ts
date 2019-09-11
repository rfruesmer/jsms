import { v4 } from "uuid";
import { JsmsMessageHeader } from "./jsms-message-header";

/**
 * The Message class is the root class of all JSMS messages.
 */
export class JsmsMessage {
    public readonly header: JsmsMessageHeader;
    public readonly body: object;

    constructor(header: JsmsMessageHeader, body: object) {
        this.header = header;
        this.body = body;
    }

    /**
     * Convenience factory method for creation of JSMS messages.
     *
     * @param channel The topic or queue name.
     * @param body The message's payload.
     * @param timeToLive The time in milliseconds (from now) until this message will be discarded.
     * @param correlationID Used for matching replies/responses to original message.
     */
    public static create(channel: string, body: object = {}, timeToLive: number = 0, correlationID: string = v4()): JsmsMessage {
        return new JsmsMessage(new JsmsMessageHeader(channel, timeToLive, correlationID), body);
    }

    public isExpired(): boolean {
        return this.header.expiration > 0 ? new Date().getTime() > this.header.expiration : false;
    }
}
