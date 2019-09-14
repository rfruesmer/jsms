import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageConsumer } from "./jsms-message-consumer";
import { JsmsQueue } from "./jsms-queue";


export class JsQueueReceiver extends JsmsMessageConsumer {
    protected deferredDeliveries = new Array<JsmsDeferred<JsmsMessage>>();
    protected deferredResponseMap = new Map<string, JsmsDeferred<JsmsMessage>>();
    protected deferredResponseList = new Array<JsmsDeferred<JsmsMessage>>();

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public receive(): JsmsDeferred<JsmsMessage> {
        const queue = this.getDestination() as JsmsQueue;
        const message = queue.dequeue();
        const deferredDelivery = this.createDeferredDelivery(message);

        return deferredDelivery;
    }

    private createDeferredDelivery(message: JsmsMessage | undefined): JsmsDeferred<JsmsMessage> {
        const deferredDelivery = message 
            ? this.createFullfilledDelivery(message) 
            : this.createPendingDelivery();
        
        this.deferredDeliveries.push(deferredDelivery);

        return deferredDelivery;
    }
    
    private createFullfilledDelivery(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        const deferredResponse = this.dequeueDeferredResponseFor(message);

        const deferredDelivery = new JsmsDeferred<JsmsMessage>(() => {
            try {
                deferredDelivery.promise.then((responseBody: object) => {
                    // @ts-ignore: deferred is guaranteed to be defined here
                    deferredResponse.resolve(JsmsMessage.createResponse(message, responseBody));
                });

                deferredDelivery.resolve(message);
            } 
            catch (error) {
                // @ts-ignore: deferred is guaranteed to be defined here
                deferredResponse.reject(error);
            }
        });

        return deferredDelivery;
    }

    private dequeueDeferredResponseFor(message: JsmsMessage): JsmsDeferred<JsmsMessage> | undefined {
        const deferredResponse = this.deferredResponseMap.get(message.header.id);
        if (deferredResponse) {
            this.deferredResponseMap.delete(message.header.id);
            const index = this.deferredResponseList.indexOf(deferredResponse);
            this.deferredResponseList.splice(index, 1);
        }

        return deferredResponse;
    }

    private createPendingDelivery(): JsmsDeferred<JsmsMessage> {
        const onDeliveryChained = (nextDelivery: any): void => {
            if (!nextDelivery) {
                return;
            }
    
            this.deferredDeliveries.push(nextDelivery);
    
            nextDelivery.onChained = (nextNextDelivery: any) => {
                this.deferredDeliveries.push(nextNextDelivery);
                nextNextDelivery.onChained = onDeliveryChained;
            };
        };

        return new JsmsDeferred<JsmsMessage>(onDeliveryChained);
    }

    public onMessage(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        const deferredResponse = this.createDeferredResponse(message);

        if (message.header.channel !== this.getDestination().getName()) {
            deferredResponse.reject("invalid channel");
            return deferredResponse;
        }
        
        if (message.isExpired()) {
            deferredResponse.reject("message expired");
            return deferredResponse;
        }

        // since this an in-process receiver, it can directly dispatch to the queue
        this.sendToQueue(message);

        return deferredResponse;
    }
    
    private createDeferredResponse(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        const onResponseChained = (nextDeferredResponse: any): void => {
            if (!nextDeferredResponse) {
                return;
            }
    
            this.deferredResponseList.push(nextDeferredResponse);
            // TODO: this.deferredResponseMap.set(...) / dequeue
    
            nextDeferredResponse.onChained = (nextNextResponse: any) => {
                this.deferredResponseList.push(nextNextResponse);
                // TODO: this.deferredResponseMap.set(...) / dequeue
                nextNextResponse.onChained = onResponseChained;
            };
        };

        const deferredResponse = new JsmsDeferred<JsmsMessage>(onResponseChained);
        this.enqueueDeferredResponseFor(message, deferredResponse);

        return deferredResponse;
    }
    
    private enqueueDeferredResponseFor(message: JsmsMessage, deferredResponse: JsmsDeferred<JsmsMessage>): void {
        this.deferredResponseList.push(deferredResponse);
        this.deferredResponseMap.set(message.header.id, deferredResponse);
    }

    private sendToQueue(message: JsmsMessage): void {
        try {
            if (this.deferredDeliveries.length === 0) {
                const queue = this.getDestination() as JsmsQueue;
                queue.enqueue(message);
                return;
            }

            const deferredDelivery = this.dequeueDeferredDeliveryFor(message);
            deferredDelivery.resolve(message);
        }
        catch (e) {
            const deferredResponse = this.deferredResponseList[0];
            this.deferredResponseList.shift();
            deferredResponse.reject(e);
            return;
        }
    }

    private dequeueDeferredDeliveryFor(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        const deferredDelivery = this.deferredDeliveries[0];
        this.deferredDeliveries.shift();

        deferredDelivery.promise.then(() => {
            const nextDeferredResponse = this.deferredResponseList[0];
            this.deferredResponseList.shift();
            this.deferredResponseMap.delete(message.header.id);

            if (deferredDelivery.thenResult) {
                nextDeferredResponse.resolve(JsmsMessage.createResponse(message, deferredDelivery.thenResult));
                nextDeferredResponse.promise.then(() => {
                    if (nextDeferredResponse.thenResult) {
                        this.sendToQueue(JsmsMessage.createResponse(message, nextDeferredResponse.thenResult));
                    }
                });
            }
        });

        return deferredDelivery;
    }
}