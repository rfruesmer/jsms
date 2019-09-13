import { JsmsService } from "@/jsms-service";
import { getLogger, Logger } from "@log4js-node/log4js-api";


let logger: Logger;
let messageService: JsmsService;

// --------------------------------------------------------------------------------------------------------------------

beforeAll(() => {
    logger = getLogger("jsms");
    logger.level = "debug";
});

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
        messageService.receive("PING").then((message: object) => {
            this.receiveCount++;
            logger.info("[HandshakeServer] received: #" + this.receiveCount + "\n" + JSON.stringify(message));

            // simulate delayed reachability by replying only on the third message
            if (this.receiveCount === 3) {
                logger.info("[HandshakeServer] sending response");
                return {reply: "PONG"};
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
        logger.info("[HandshakeClient] sending ping");

        messageService.send("PING")
            .then((response: object) => {
                this.ack = true;
                logger.info("[HandshakeClient] received response: " + "\n" + JSON.stringify(response));
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
