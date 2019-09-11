import { JsMessageConsumer } from "@/js-message-consumer";
import { JsmsConnection } from "@/jsms-connection";
import { JsmsDestination } from "@/jsms-destination";


export class FakeMessageConsumer extends JsMessageConsumer {

    constructor(connection: JsmsConnection, destination: JsmsDestination) {
        super(connection, destination);
    }
}