
/**
 * Common abstraction for queues and topics.
 */
export abstract class JsmsDestination {
    private name: string;

    public abstract close(): void;

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Gets the name of this queue.
     */
    public getName(): string {
        return this.name;
    }
}
