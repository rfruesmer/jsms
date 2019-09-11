import { v4 } from "uuid";

export class JsmsMessageHeader {
    public readonly id: string;
    public readonly channel: string;
    public readonly correlationID: string;
    public readonly expiration: number;

    /**
     * @param channel The topic or queue name.
     * @param timeToLive The time in milliseconds (from now) until this message will be discarded.
     * @param correlationID Used for matching replies/responses to original message.
     */
    constructor(channel: string, timeToLive: number, correlationID: string) {
        this.id = v4();
        this.channel = channel;
        this.expiration = timeToLive > 0 ? new Date().getTime() + timeToLive : 0;
        this.correlationID = correlationID;
    }
}
