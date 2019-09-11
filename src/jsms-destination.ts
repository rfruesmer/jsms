import { JsmsDeferred } from "./jsms-deferred";
import { JsmsMessage } from "./jsms-message";

export abstract class JsmsDestination {
    private name: string;

    public abstract close(): void;

    constructor(name: string) {
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }
}
