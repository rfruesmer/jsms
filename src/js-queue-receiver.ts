import { JsmsConnection } from "./jsms-connection";
import { JsmsDeferred } from "./jsms-deferred";
import { JsmsDestination } from "./jsms-destination";
import { JsmsMessage } from "./jsms-message";
import { JsmsMessageConsumer } from "./jsms-message-consumer";
import { JsmsQueue } from "./jsms-queue";


export class JsQueueReceiver extends JsmsMessageConsumer {
    protected receivers = new Array<JsmsDeferred<JsmsMessage>>();
    protected senders = new Map<string, JsmsDeferred<JsmsMessage>>();

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public receive(): JsmsDeferred<JsmsMessage> {
        const queue = this.getDestination() as JsmsQueue;
        const message = queue.dequeue();
        const receiver = this.createReceiver(message);
        if (!message) {
            this.receivers.push(receiver);
        }

        return receiver;
    }

    private createReceiver(message: JsmsMessage | undefined): JsmsDeferred<JsmsMessage> {
        if (!message) {
            return new JsmsDeferred<JsmsMessage>();
        }

        const sender = this.senders.get(message.header.id);

        let chained = false;
        const receiver = new JsmsDeferred<JsmsMessage>(() => {
            if (chained) {
                return;
            }
            chained = true;
            
            receiver.promise.then((responseBody: object) => {
                // @ts-ignore: sender is guaranteed to be valid here
                sender.resolve(JsmsMessage.create(message.header.channel, responseBody, 0, message.header.correlationID));
            });

            try {
                receiver.resolve(message);
            } 
            catch (error) {
                // @ts-ignore: sender is guaranteed to be valid here
                sender.reject(error);
            }
        });

        return receiver;
    }

    public onMessage(message: JsmsMessage, sender: JsmsDeferred<JsmsMessage>): boolean {
        if (message.header.channel !== this.getDestination().getName()
                || message.isExpired()) {
            return false;
        }

        // since this an in-process receiver, it can directly dispatch to the queue
        return this.sendToQueue(message, sender);
    }

    private sendToQueue(message: JsmsMessage, sender: JsmsDeferred<JsmsMessage>): boolean {
        try {
            const receiver = this.dequeueReceiver(message, sender);
            if (!receiver) {
                return false;
            }
            receiver.resolve(message);
        }
        catch (e) {
            sender.reject(e);
            return false;
        }

        return true;
    }

    private dequeueReceiver(message: JsmsMessage, sender: JsmsDeferred<JsmsMessage>): JsmsDeferred<JsmsMessage> | null {
        if (this.receivers.length === 0) {
            this.senders.set(message.header.id, sender);
            return null;
        }

        const receiver = this.receivers[0];
        receiver.promise.then((responseBody: object) => {
            sender.resolve(JsmsMessage.create(message.header.channel, responseBody, 0, message.header.correlationID));
        });

        this.receivers.shift();     

        return receiver;
    }
}