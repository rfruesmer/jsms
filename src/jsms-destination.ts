import { JsmsDeferred } from "./jsms-deferred";
import { JsmsMessage } from "./jsms-message";

export abstract class JsmsDestination {
    private name: string;

    // TODO: consider delegating to connection/producer
    public sendOld(message: JsmsMessage): Promise<JsmsMessage> {
        // tslint:disable-next-line: no-empty
        return new Promise<JsmsMessage>(() => {});
    }

    // TODO: consider delegating to connection/consumer
    public receiveOld(): JsmsDeferred<JsmsMessage, object, Error> {
        // tslint:disable-next-line: no-empty
        return new JsmsDeferred<JsmsMessage, object, Error>(() => {});
    }

    public abstract close(): void;

    constructor(name: string) {
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }
}
