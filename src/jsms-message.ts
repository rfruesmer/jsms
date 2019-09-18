import { v4 } from "uuid";
import { JsmsMessageHeader } from "./jsms-message-header";

/**
 *  A generic message class with a JSON body/payload.
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
     * @param destination   The topic or queue name.
     * @param body          The message's JSON payload 
     * @param timeToLive    The time in milliseconds (from now) until this message will be discarded 
     *                      or -1 if the message shouldn't expire.
     * @param correlationID Used for matching replies/responses to original message.
     */
    public static create(destination: string, 
                         body: object = {}, 
                         timeToLive: number = -1, 
                         correlationID: string = v4()): JsmsMessage {
        const expiration = timeToLive > -1 ? new Date().getTime() + timeToLive : 0;
        return new JsmsMessage(new JsmsMessageHeader(v4(), destination, expiration, correlationID), body);
    }

    /**
     * Convenience factory method for creating a response.
     *
     * @param destination The topic or queue name.
     * @param body The message's payload.
     * @param timeToLive The time in milliseconds (from now) until this message will be discarded.
     * @param correlationID Used for matching replies/responses to original message.
     */
    public static createResponse(originalMessage: JsmsMessage, 
                                 responseBody: object = {}, 
                                 timeToLive: number = -1): JsmsMessage {
        return JsmsMessage.create(originalMessage.header.destination, responseBody, 
            timeToLive, originalMessage.header.correlationID);
    }

    /**
     *  Convenience factory method for converting a JSON string to a message.
     */
    public static fromString(jsonString: string): JsmsMessage {
        const jsonObject = JSON.parse(jsonString);
        
        const header = new JsmsMessageHeader(
            jsonObject.header.id, 
            jsonObject.header.destination, 
            jsonObject.header.expiration, 
            jsonObject.header.correlationID);
        
        return new JsmsMessage(header, jsonObject.body);
    }

    /**
     *  Convenience method for converting message to a JSON string - counterpart to fromString().
     */
    public toString(): string {
        return JSON.stringify(this);
    }

    public isExpired(): boolean {
        return this.header.expiration > 0 
                ? new Date().getTime() > this.header.expiration 
                : false;
    }
}
