import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageConsumer } from "./jsms-message-consumer";
import { JsmsQueue } from "./jsms-queue";


export class JsmsQueueReceiver extends JsmsMessageConsumer {
    private deferredDeliveries = new Array<JsmsDeferred<JsmsMessage>>();
    private deferredResponses = new Map<string, JsmsDeferred<JsmsMessage>>();

    constructor(destination: JsmsDestination) {
        super(destination);
        
        this.queue.addMessageExpiredListener((message: JsmsMessage) => {
            const deferredResponse = this.dequeueResponseFor(message);
            deferredResponse.reject(message.createExpirationMessage());
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

    private deliverTo(deferredDelivery: JsmsDeferred<JsmsMessage>, 
                      message: JsmsMessage, 
                      deferredResponse: JsmsDeferred<JsmsMessage>): void {
        const interceptedDeliverySuccessor = deferredDelivery.intercept();
        deferredDelivery.resolve(message)
            .then((responseBody: object) => {
                const response = JsmsMessage.createResponse(message, responseBody ? responseBody : {});
                this.resolve(deferredResponse, response, interceptedDeliverySuccessor);
            })
            .catch((reason: any) => {
                deferredResponse.reject(reason);
            });
    }
    
    private resolve(deferredResponse: JsmsDeferred<JsmsMessage>, 
                    response: JsmsMessage, 
                    interceptedDeliverySuccessor: JsmsDeferred<JsmsMessage> | undefined): void {
        const interceptedResponseSuccessor = deferredResponse.intercept();
        deferredResponse.resolve(response)
            .then((nextResponseBody: object) => {
                if (interceptedDeliverySuccessor
                        && interceptedResponseSuccessor) {
                    const nextResponse = JsmsMessage.createResponse(response, nextResponseBody ? nextResponseBody : {});
                    this.deliverTo(interceptedDeliverySuccessor, nextResponse, interceptedResponseSuccessor);
                }
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
        if (message.header.destination !== this.getDestination().getName()) {
            deferredResponse.reject("invalid destination");
            return false;
        }
        
        if (message.isExpired()) {
            deferredResponse.reject(message.createExpirationMessage());
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

    /** NO public API - only used for testing */
    public isEmpty(): boolean {
        return this.deferredDeliveries.length === 0
                && this.deferredResponses.size === 0;
    }
}