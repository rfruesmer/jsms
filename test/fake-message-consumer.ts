import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageConsumer } from "@/jsms-message-consumer";
import { JsmsDeferred } from "@/jsms-deferred";
import { JsmsConnection } from "@/jsms-connection";
import { JsmsDestination } from "@/jsms-destination";
import { JsmsMessageListener } from "@/jsms-message-listener";
import { JsmsTopic } from "@/jsms-topic";


export class FakeMessageConsumer implements JsmsMessageConsumer, JsmsMessageListener {
    private connection: JsmsConnection;
    private destination: any;
    
    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        this.connection = connection;
        this.destination = destination;
    }

    public receive(): JsmsDeferred<JsmsMessage, object, Error> {
        const deferred = new JsmsDeferred<JsmsMessage, object, Error>();

        if (this.destination instanceof JsmsTopic) {
            const topic = this.destination as JsmsTopic;
            topic.subscribe((message: JsmsMessage) => {
                deferred.resolve(message);
            });
        }
        else {
            throw new Error("Not implemented.");
        }
        
        return deferred;
    }

    public onMessage(message: JsmsMessage): void {
        if (this.destination instanceof JsmsTopic) {
            const topic = this.destination as JsmsTopic;
            topic.getSubscribers().forEach(subscriber => subscriber(message));
        }
        else {
            throw new Error("Not implemented.");
        }
    }
}