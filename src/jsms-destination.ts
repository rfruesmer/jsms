import { JsmsDeferred } from "./jsms-deferred";
import { JsmsMessage } from "./jsms-message";

export interface JsmsDestination {
    // TODO: consider delegating to connection
    send(message: JsmsMessage): Promise<JsmsMessage>;
    receive(): JsmsDeferred<JsmsMessage, object, Error>;
}