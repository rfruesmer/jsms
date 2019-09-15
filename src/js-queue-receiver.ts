import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageConsumer } from "./jsms-message-consumer";
import { JsmsQueue } from "./jsms-queue";


export class JsQueueReceiver extends JsmsMessageConsumer {
    private deferredDeliveries = new Array<JsmsDeferred<JsmsMessage>>();
    private deferredResponses = new Map<string, JsmsDeferred<JsmsMessage>>();

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
        
        this.queue.addMessageExpiredListener((message: JsmsMessage) => {
            const deferredResponse = this.dequeueResponseFor(message);
            deferredResponse.reject("message expired");
        });
    }

    public receive(): JsmsDeferred<JsmsMessage> {
        const deferredDelivery = new JsmsDeferred<JsmsMessage>();
        const message = this.queue.dequeue();
        if (message) {
            this.deliverTo(deferredDelivery, message, this.dequeueResponseFor(message));
        }
        else {
            this.enqueueDelivery(deferredDelivery);
        }

        return deferredDelivery;
    }

    private get queue(): JsmsQueue {
        return this.getDestination() as JsmsQueue;
    }

    private dequeueResponseFor(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        const response = this.deferredResponses.get(message.header.id);
        this.deferredResponses.delete(message.header.id);
        // @ts-ignore: response is guaranteed to be defined
        return response;
    }

    private deliverTo(deferredDelivery: JsmsDeferred<JsmsMessage>, message: JsmsMessage, deferredResponse: JsmsDeferred<JsmsMessage>): void {
        deferredDelivery.resolve(message)
            .then((responseBody: object) => {
                deferredResponse.resolve(JsmsMessage.createResponse(message, responseBody));
            })
            .catch((reason: any) => {
                deferredResponse.reject(reason);
            });
    }

    private enqueueDelivery(deferredDelivery: JsmsDeferred<JsmsMessage>): void {
        this.deferredDeliveries.push(deferredDelivery);
    }

    public onMessage(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        const deferredResponse = new JsmsDeferred<JsmsMessage>();
        if (!this.validate(message, deferredResponse)) {
            return deferredResponse;
        }

        const deferredDelivery = this.dequeueDelivery();
        if (deferredDelivery) {
            this.deliverTo(deferredDelivery, message, deferredResponse);
        }
        else {
            this.enqueue(message, deferredResponse);                
        }

        return deferredResponse;
    }
    
    private validate(message: JsmsMessage, deferredResponse: JsmsDeferred<JsmsMessage>): boolean {
        if (message.header.channel !== this.getDestination().getName()) {
            deferredResponse.reject("invalid channel");
            return false;
        }
        
        if (message.isExpired()) {
            deferredResponse.reject("message expired");
            return false;
        }

        return true;
    }
    
    private dequeueDelivery(): JsmsDeferred<JsmsMessage> | undefined {
        return this.deferredDeliveries.shift();
    }

    private enqueue(message: JsmsMessage, deferredResponse: JsmsDeferred<JsmsMessage>): void {
        this.queue.enqueue(message);
        this.deferredResponses.set(message.header.id, deferredResponse);
    }

    /**
     *  Only used for testing and NOT part of the public API.
     */
    public isEmpty(): boolean {
        return this.deferredDeliveries.length === 0
                && this.deferredResponses.size === 0;
    }
}