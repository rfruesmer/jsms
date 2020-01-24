
import { JsmsConnection } from "../jsms-connection";
import { JsmsDeferred } from "../jsms-deferred";
import { JsmsMessage } from "../jsms-message";
import { checkState } from "../preconditions";
import { JsmsQueue } from "../jsms-queue";
import { JsmsQueueSender } from "../jsms-queue-sender";
import { JsmsQueueReceiver } from "../jsms-queue-receiver";
import { JsmsTopic } from "../jsms-topic";
import { JsmsTopicPublisher } from "../jsms-topic-publisher";
import { JsmsTopicSubscriber } from "../jsms-topic-subscriber";

const DEBUG = true;

export class ChromiumConnection extends JsmsConnection {
    private globalNS: any;
    private responseDeferreds = new Map<string, JsmsDeferred<JsmsMessage>>();

    /**
     * @param globalNS is only used by unit tests -
     *        in production code you should ignore it and just leave it undefined
     */
    constructor(globalNS?: any) {
        super();

        this.globalNS = globalNS ? globalNS : window;
        this.globalNS.onMessage = (json: any) => {
            this.onMessage(JsmsMessage.fromJSON(json));
        };
    }

    private onMessage(message: JsmsMessage): void {
        const responseDeferred = this.responseDeferreds.get(message.header.correlationID);
        if (responseDeferred) {
            this.handleResponse(message, responseDeferred);
        }
        else {
            const destination = this.getDestinationFor(message.header.destination);
            const consumer = this.getConsumer(destination);

            consumer.onMessage(message);
        }
    }

    private handleResponse(response: JsmsMessage, responseDeferred: JsmsDeferred<JsmsMessage>): void {
        if (DEBUG) {
            console.log("[CHROMIUM] Receiving response: \""
                + response.header.destination + "\" ["
                + response.header.correlationID + "]:\n"
                + JSON.stringify(response.body));
        }

        this.responseDeferreds.delete(response.header.correlationID);
        responseDeferred.resolve(response);
    }

    public createQueue(queueName: string): JsmsQueue {
        const queue = new JsmsQueue(queueName);
        this.addQueue(queue, new JsmsQueueSender(this, queue), new JsmsQueueReceiver(queue));
        return queue;
    }

    public createTopic(topicName: string): JsmsTopic {
        const topic = new JsmsTopic(topicName);
        this.addTopic(topic, new JsmsTopicPublisher(topic), new JsmsTopicSubscriber(topic));
        return topic;
    }

    public send(message: JsmsMessage): JsmsDeferred<JsmsMessage> {
        checkState(typeof this.globalNS.cefQuery === "function",
            "cef message router is not available!");

        if (DEBUG) {
            console.log("[CHROMIUM] Sending request: \""
                + message.header.destination + "\" ["
                + message.header.correlationID + "]:\n"
                + JSON.stringify(message.body));
        }

        const deferredResponse = new JsmsDeferred<JsmsMessage>();
        this.sendToChromium(message, deferredResponse);
        this.handleExpiration(message, deferredResponse);

        return deferredResponse;
    }

    private sendToChromium(message: JsmsMessage, deferredResponse: JsmsDeferred<JsmsMessage>): void {
        this.responseDeferreds.set(message.header.correlationID, deferredResponse);

        const cefQuery = {
            request: message.toString(),
            persistent: false,
            onSuccess: (response: string) => {
                deferredResponse.resolve(JsmsMessage.fromString(response));
                this.responseDeferreds.delete(message.header.correlationID);
            },
            onFailure: (errorCode: number, errorMessage: string) => {
                console.error("[CHROMIUM] cefQuery call failed for: "
                    + "\ntopic: " + message.header.destination
                    + "\nerror-code: " + errorCode
                    + "\nerror-message: " + errorMessage);


                deferredResponse.reject(errorMessage);
                this.responseDeferreds.delete(message.header.correlationID);
            }
        };

        this.globalNS.cefQuery(cefQuery);
    }

    private handleExpiration(message: JsmsMessage, deferredResponse: JsmsDeferred<JsmsMessage>): void {
        if (message.header.expiration === 0) {
            return;
        }

        let timeToLive = message.header.expiration - new Date().getTime();
        timeToLive = Math.max(0, timeToLive);

        setTimeout(() => {
            this.responseDeferreds.delete(message.header.correlationID);
            deferredResponse.reject("message expired");
        }, timeToLive);
    }

    public sendReady(): JsmsDeferred<JsmsMessage> {
        const deferredResponse = new JsmsDeferred<JsmsMessage>();
        deferredResponse.resolve(JsmsMessage.create("bla"));
        // deferredResponse.reject("blubb");
        return deferredResponse;
    }
}