import { Message } from "@/message";
import { MessageConsumer } from "@/message-consumer";
import { Deferred } from "@/deferred";
import { Connection } from "@/connection";
import { Destination } from "@/destination";


export class FakeMessageConsumer implements MessageConsumer {
    private connection: Connection;
    private destination: any;
    private deferred!: Deferred<Message, object, Error>;
    
    constructor(connection: Connection, destination: Destination) {
        this.connection = connection;
        this.destination = destination;
    }

    public receive(): Deferred<Message, object, Error> {
        this.deferred = new Deferred<Message, object, Error>();
        
        return this.deferred;
    }

    public emit(message: Message): void {
        this.deferred.resolve(message);
    }
}