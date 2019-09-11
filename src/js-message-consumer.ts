import { JsmsDeferred } from "@/jsms-deferred";
import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageConsumer } from "@/jsms-message-consumer";
import { JsmsConnection } from "./jsms-connection";
import { JsmsDestination } from "./jsms-destination";
import { JsmsQueue } from "./jsms-queue";
import { JsmsTopic } from "./jsms-topic";

export class JsMessageConsumer extends JsmsMessageConsumer {
    protected receiveDeferreds = new Array<JsmsDeferred<JsmsMessage, object, Error>>();
    protected responseDeferreds = new Map<string, JsmsDeferred<JsmsMessage, object, Error>>();

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }

    public receive(): JsmsDeferred<JsmsMessage, object, Error> {
        if (this.destination instanceof JsmsTopic) {
            // TODO: check if a deferred is really necessary/useful here
            const receiveDeferred = new JsmsDeferred<JsmsMessage, object, Error>();
            const topic = this.destination as JsmsTopic;
            topic.subscribe((message: JsmsMessage) => {
                receiveDeferred.resolve(message);
            });

            return receiveDeferred;
        } else {
            const queue = this.destination as JsmsQueue;
            const message = queue.dequeue();
            const receiveDeferred = this.createReceiveDeferred(message);
            if (!message) {
                this.receiveDeferreds.push(receiveDeferred);
            }

            return receiveDeferred;
        }
    }

    private createReceiveDeferred(message: JsmsMessage | undefined): JsmsDeferred<JsmsMessage, object, Error> {
        const receiveDeferred = new JsmsDeferred<JsmsMessage, object, Error>(() => {
            if (!message) {
                return;
            }

            const responseDeferred = this.responseDeferreds.get(message.header.id);

            receiveDeferred.promise.then((responseBody: object) => {
                const request = message;
                const response = JsmsMessage.create(
                    request.header.channel,
                    responseBody,
                    0,
                    request.header.correlationID
                );
                if (responseDeferred) {
                    responseDeferred.resolve(response);
                }
            });

            try {
                receiveDeferred.resolve(message);
            } catch (error) {
                if (responseDeferred) {
                    responseDeferred.reject(error);
                }
            }
        });

        return receiveDeferred;
    }

    public onMessage(message: JsmsMessage, responseDeferred: JsmsDeferred<JsmsMessage, object, Error>): boolean {
        if (this.destination instanceof JsmsTopic) {
            const topic = this.destination as JsmsTopic;
            topic.getSubscribers().forEach(subscriber => subscriber(message));
        } else {
            if (this.receiveDeferreds.length === 0) {
                this.responseDeferreds.set(message.header.id, responseDeferred);
                return false;
            }

            const receiveDeferred = this.receiveDeferreds[0];
            receiveDeferred.promise.then((responseBody: object) => {
                const response = JsmsMessage.create(
                    message.header.channel,
                    responseBody,
                    0,
                    message.header.correlationID
                );
                responseDeferred.resolve(response);
            });
            this.receiveDeferreds.shift();
            receiveDeferred.resolve(message);
        }

        return true;
    }
}
