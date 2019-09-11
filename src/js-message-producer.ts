import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageProducer } from "@/jsms-message-producer";
import { JsmsConnection } from "./jsms-connection";
import { JsmsDestination } from "./jsms-destination";
import { JsmsTopic } from "./jsms-topic";


export class JsMessageProducer implements JsmsMessageProducer {
    private connection: JsmsConnection;
    private destination: JsmsDestination;

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        this.connection = connection;
        this.destination = destination;
    }

    public send(message: JsmsMessage): Promise<JsmsMessage> {
        // return this.destination.send(message);

        const promise = new Promise<JsmsMessage>((resolve, reject) => {
            if (this.destination instanceof JsmsTopic) {
                this.publish(message);
                resolve();
            }
            else {
                throw new Error("Not implemented.");
            }
        });

        return promise;
    }
    
    private publish(message: JsmsMessage): void {
        const topic = this.destination as JsmsTopic;
        topic.getSubscribers().forEach(subscriber => {
            try {
                subscriber(message);
            }
            catch (error) {
                console.error(error);
            }
        });
    }
}