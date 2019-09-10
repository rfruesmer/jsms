export class JsmsMessageHeader {
    public readonly channel: string;
    public readonly correlationID: string;
    public readonly expiration: number;

    constructor(channel: string, correlationID: string, expiration: number) {
        this.channel = channel;
        this.correlationID = correlationID;
        this.expiration = expiration > 0 ? new Date().getTime() + expiration : 0;
    }
}
