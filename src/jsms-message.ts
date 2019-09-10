import { JsmsMessageHeader } from "./jsms-message-header";

export class JsmsMessage {
    public readonly header: JsmsMessageHeader;
    public readonly body: object;

    constructor(header: JsmsMessageHeader, body: object = {}) {
        this.header = header;
        this.body = body;
    }
}
