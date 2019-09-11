import { JsmsDeferred } from "@/jsms-deferred";
import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageConsumer } from "@/jsms-message-consumer";
import { JsmsConnection } from "./jsms-connection";
import { JsmsDestination } from "./jsms-destination";
import { JsmsQueue } from "./jsms-queue";
import { JsmsTopic } from "./jsms-topic";

export class JsMessageConsumer extends JsmsMessageConsumer {
    protected receivers = new Array<JsmsDeferred<JsmsMessage, object, Error>>();
    protected senders = new Map<string, JsmsDeferred<JsmsMessage, object, Error>>();

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public receive(): JsmsDeferred<JsmsMessage, object, Error> {
        if (this.destination instanceof JsmsTopic) {
            return this.receiveTopicMessage();
        } 
        else {
            return this.receiveQueueMessage();
        }
    }

    private receiveTopicMessage(): JsmsDeferred<JsmsMessage, object, Error> {
        const receiver = new JsmsDeferred<JsmsMessage, object, Error>();
        const topic = this.destination as JsmsTopic;
        topic.subscribe((message: JsmsMessage) => {
            receiver.resolve(message);
        });

        return receiver;
    }

    private receiveQueueMessage(): JsmsDeferred<JsmsMessage, object, Error> {
        const queue = this.destination as JsmsQueue;
        const message = queue.dequeue();
        const receiver = this.createReceiver(message);
        if (!message) {
            this.receivers.push(receiver);
        }

        return receiver;
    }

    private createReceiver(message: JsmsMessage | undefined): JsmsDeferred<JsmsMessage, object, Error> {
        if (!message) {
            return new JsmsDeferred<JsmsMessage, object, Error>();
        }

        const sender = this.senders.get(message.header.id);

        const receiver = new JsmsDeferred<JsmsMessage, object, Error>(() => {
            receiver.promise.then((responseBody: object) => {
                const request = message;
                const response = JsmsMessage.create(
                    request.header.channel,
                    responseBody,
                    0,
                    request.header.correlationID
                );
                // @ts-ignore: responseDeferred is guaranteed to be valid here
                sender.resolve(response);
            });

            try {
                receiver.resolve(message);
            } 
            catch (error) {
                // @ts-ignore: responseDeferred is guaranteed to be valid here
                sender.reject(error);
            }
        });

        return receiver;
    }

    public onMessage(message: JsmsMessage, sender: JsmsDeferred<JsmsMessage, object, Error>): boolean {
        if (this.destination instanceof JsmsTopic) {
            return this.sendToTopic(message);
        } 
        else {
            return this.sendToQueue(message, sender);
        }
    }

    private sendToTopic(message: JsmsMessage): boolean {
        let result = true;
        const topic = this.destination as JsmsTopic;
        topic.getSubscribers().forEach(subscriber => {
            try {
                subscriber(message)
            }
            catch (e) {
                console.error(e);
                result = false;
            }
        });

        return false;
    }

    private sendToQueue(message: JsmsMessage, sender: JsmsDeferred<JsmsMessage, object, Error>): boolean {
        try {
            const receiver = this.enqueueReceiver(message, sender);
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

    private enqueueReceiver(message: JsmsMessage, sender: JsmsDeferred<JsmsMessage, object, Error>): JsmsDeferred<JsmsMessage, object, Error> | null {
        if (this.receivers.length === 0) {
            this.senders.set(message.header.id, sender);
            return null;
        }

        const receiver = this.receivers[0];
        receiver.promise.then((responseBody: object) => {
            const response = JsmsMessage.create(
                message.header.channel,
                responseBody,
                0,
                message.header.correlationID
            );

            sender.resolve(response);
        });

        this.receivers.shift();     

        return receiver;
    }
}
