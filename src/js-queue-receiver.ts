import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageConsumer } from "./jsms-message-consumer";
import { JsmsQueue } from "./jsms-queue";
import { getLogger } from "@log4js-node/log4js-api";


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
        const deferredResponse = this.deferredResponseMap.get(message.header.id);
        // TODO: check if this needs to be removed

        let chained = false;
        const deferredDelivery = new JsmsDeferred<JsmsMessage>(() => {
            if (chained) {
                return;
            }
            chained = true;
            
            deferredDelivery.promise.then((responseBody: object) => {
                // @ts-ignore: sender is guaranteed to be valid here
                deferredResponse.resolve(JsmsMessage.createResponse(message, responseBody));
            });

            try {
                deferredDelivery.resolve(message);
            } 
            catch (error) {
                // @ts-ignore: sender is guaranteed to be valid here
                deferredResponse.reject(error);
            }
        });

        return deferredDelivery;
    }

    private createPendingDelivery(): JsmsDeferred<JsmsMessage> {
        const delivery = new JsmsDeferred<JsmsMessage>((nextDelivery: any) => {
            this.onDeliveryChained(nextDelivery);
        });

        return delivery;
    }

    private onDeliveryChained = (nextDelivery: any): void => {
        if (!nextDelivery) {
            return;
        }

        this.deferredDeliveries.push(nextDelivery);

        nextDelivery.onChained = (nextNextDelivery: any) => {
//            if (nextNextDelivery) {
                this.deferredDeliveries.push(nextNextDelivery);
                nextNextDelivery.onChained = this.onDeliveryChained;
//            }
        };
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
        const deferredResponse = new JsmsDeferred<JsmsMessage>((nextDeferredResponse: any) => {
            this.onResponseChained(nextDeferredResponse);
        });

        this.deferredResponseList.push(deferredResponse);
        this.deferredResponseMap.set(message.header.id, deferredResponse);

        return deferredResponse;
    }

    private onResponseChained = (nextDeferredResponse: any): void => {
        if (!nextDeferredResponse) {
            return;
        }

        this.deferredResponseList.push(nextDeferredResponse);
        // TODO: this.deferredResponseMap.set(...);

        nextDeferredResponse.onChained = (nextNextResponse: any) => {
            nextDeferredResponse.chained = false; // TODO: check if this is still needed
//            if (nextNextResponse) {
                this.deferredResponseList.push(nextNextResponse);
                // TODO: this.deferredResponseMap.set(...);
                nextNextResponse.onChained = this.onResponseChained;
//            }
        };
    }

    private sendToQueue(message: JsmsMessage): void {
        if (this.deferredDeliveries.length === 0) {
            const queue = this.getDestination() as JsmsQueue;
            queue.enqueue(message);
            return;
        }

        const delivery = this.deferredDeliveries[0];
        this.deferredDeliveries.shift();
            
        try {
            // TODO: correlation id (???)
            delivery.resolve(message);
            getLogger().info(delivery.thenResult);
        }
        catch (e) {
            const deferredResponse = this.deferredResponseList[0];
            this.deferredResponseList.shift();
            deferredResponse.reject(e);
            return;
        }

        delivery.promise.then((value: object) => {
            const nextDeferredResponse = this.deferredResponseList[0];
            this.deferredResponseList.shift();
            this.deferredResponseMap.delete(message.header.id);

            if (delivery.thenResult) {
                nextDeferredResponse.resolve(JsmsMessage.createResponse(message, delivery.thenResult));
                nextDeferredResponse.promise.then((_value: object) => {
                    if (nextDeferredResponse.thenResult) {
                        this.sendToQueue(JsmsMessage.createResponse(message, nextDeferredResponse.thenResult));
                    }
                });
            }
        });
    }
}