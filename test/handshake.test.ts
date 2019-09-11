import { JsmsService } from "@/jsms-service";
import { JsmsMessage } from "@/jsms-message";

// let retryCount = 0;
let messageService: JsmsService;

// --------------------------------------------------------------------------------------------------------------------

beforeEach(() => {
    messageService = new JsmsService();
});

// --------------------------------------------------------------------------------------------------------------------

afterEach(() => {
    messageService.close();
});

// --------------------------------------------------------------------------------------------------------------------

class HandshakeServer {
    private receiveCount = 0;

    public receivePing(): void {
        messageService.receive("PING").then((message: JsmsMessage, resolve) => {
            this.receiveCount++;
            console.log("[HandshakeServer] received: #" + this.receiveCount + "\n" + JSON.stringify(message));

            // simulate delayed reachability by replying only on the third message
            if (this.receiveCount === 3) {
                console.log("[HandshakeServer] sending response")
                resolve({reply: "PONG"});
            }
            else {
                // listen & repeat
                this.receivePing();
            }
        });
    }
}

// --------------------------------------------------------------------------------------------------------------------

class HandshakeClient {
    private MAX_TRIES = 10;
    private retryCount = 0;
    private ack = false;

    constructor(private done: any) {}

    public sendPing(): void {
        console.log("[HandshakeClient] sending ping")

        messageService.send("PING")
            .then((response: JsmsMessage) => {
                this.ack = true;
                console.log("[HandshakeClient] received response: " + "\n" + JSON.stringify(response));
                this.done();
            });

        setTimeout(() => {
            if (!this.ack && this.retryCount < this.MAX_TRIES) {
                this.retryCount++;
                this.sendPing();
            }
        }, 500);
    }
}

// --------------------------------------------------------------------------------------------------------------------

test("handshake simulation", (done) => {
    const handshakeServer = new HandshakeServer();
    handshakeServer.receivePing();
    
    const handshakeClient = new HandshakeClient(done);
    handshakeClient.sendPing();
});

// --------------------------------------------------------------------------------------------------------------------
