
/**
 *  Header fields contain values used by both clients and providers to identify 
 *  and route messages.
 */
export class JsmsMessageHeader {
    public readonly id: string;
    public readonly destination: string;
    public readonly expiration: number;
    public readonly correlationID: string;

    /**
     * @param id            This message's unique id
     * @param destination   The topic or queue name.
     * @param expiration    The time in milliseconds when this message will expire
     *                      or 0 if the message shouldn't expire.
     * @param correlationID Used for matching replies/responses to original message.
     */
    constructor(id: string, destination: string, expiration: number, correlationID: string) {
        this.id = id;
        this.destination = destination;
        this.expiration = expiration;
        this.correlationID = correlationID;
    }
}
