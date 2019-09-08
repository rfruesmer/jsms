import { MessageHeader } from "./message-header";

export class Message {
    public readonly header: MessageHeader;
    public readonly body: object;

    constructor(header: MessageHeader, body: object = {}) {
        this.header = header;
        this.body = body;
    }
}
