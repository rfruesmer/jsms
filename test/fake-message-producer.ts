import { MessageProducer } from "@/message-producer";
import { Message } from "@/message";
import { Connection } from "@/connection";
import { Destination } from "@/destination";


export class FakeMessageProducer implements MessageProducer {
    private connection: Connection;
    private destination: any;
    private lastMessage!: Message;
    
    constructor(connection: Connection, destination: Destination) {
        this.connection = connection;
        this.destination = destination;
    }
    
    public send(message: Message): Promise<Message> {
        this.lastMessage = message;
        const promise = new Promise<Message>((resolve, reject) => {
            resolve();
        });

        return promise;
    }

    public getLastMessage(): Message {
        return this.lastMessage;
    }
}