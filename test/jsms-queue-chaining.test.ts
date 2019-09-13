import { JsmsDeferred } from "@/jsms-deferred";
import { getLogger, Logger } from "@log4js-node/log4js-api";

let logger: Logger;

// --------------------------------------------------------------------------------------------------------------------

beforeAll(() => {
    logger = getLogger("jsms");
    logger.level = "debug";
});

// --------------------------------------------------------------------------------------------------------------------

class PingPongService {
    private receivers = new Array<JsmsDeferred<object>>();
    private senders = new Array<JsmsDeferred<object>>();

    public receive(): JsmsDeferred<object> {
        const receiver = this.createReceiverDeferred();
        receiver.debugId = "Receiver";

        return receiver;
    }

    private createReceiverDeferred(): JsmsDeferred<object> {
        const receiverDeferred = new JsmsDeferred<object>((receiverDeferredNext: any) => {
            this.onReceiverChained(receiverDeferredNext);
        });
        this.receivers.push(receiverDeferred);

        return receiverDeferred;
    }
    
    private onReceiverChained = (receiverDeferredNext: any): void => {
        if (!receiverDeferredNext) {
            return;
        }

        this.receivers.push(receiverDeferredNext);

        receiverDeferredNext.onChained = (receiverDeferredNextNext: any) => {
            this.receivers.push(receiverDeferredNextNext);
            receiverDeferredNextNext.onChained = this.onReceiverChained;
        };
    }

    public send(message: object): JsmsDeferred<object> {
        const sender = this.createSenderDeferred();
        sender.debugId = "Sender";

        this.resolve(message);

        return sender;
    }

    private createSenderDeferred(): JsmsDeferred<object> {
        const senderDeferred = new JsmsDeferred<object>((senderDeferredNext: any) => {
            this.onSenderChained(senderDeferredNext);
        });
        this.senders.push(senderDeferred);

        return senderDeferred;
    }
    
    private onSenderChained = (senderDeferredNext: any): void => {
        if (!senderDeferredNext) {
            return;
        }

        this.senders.push(senderDeferredNext);

        senderDeferredNext.onChained = (senderDeferredNextNext: any) => {
            senderDeferredNext.chained = false;
            this.senders.push(senderDeferredNextNext);
            senderDeferredNextNext.onChained = this.onSenderChained;
            senderDeferredNextNext.promise.then((value: object) => {
                logger.info(value);
            });
        };
    }

    private resolve(message: object): void {
        const receiver = this.receivers[0];
        this.receivers.shift();

        if (!receiver) {
            return;
        }
            
        receiver.resolve(message);
        receiver.promise.then((value: object) => {
            const senderNext = this.senders[0];
            this.senders.shift();

            if (receiver.thenResult && senderNext) {
                senderNext.resolve(receiver.thenResult);
                senderNext.promise.then((_value: object) => {
                    if (senderNext.thenResult) {
                        this.resolve(senderNext.thenResult);
                    }
                });
            }
        });
    }
}
// --------------------------------------------------------------------------------------------------------------------

test("ping-pong", async () => {

    const requests = new Array<object>();
    const responses = new Array<object>();

    const pingPongService = new PingPongService();

    const promise = new Promise<void>((resolve) => {
        pingPongService.receive()
            .then((actualRequest: object) => {
                expect(actualRequest).toEqual({request: "PING1"});
                const response = {response: "PONG1"};
                responses.push(response);
                return response;
            })
            .then((actualRequest: object) => {
                expect(actualRequest).toEqual({request: "PING2"});
                const response = {response: "PONG2"};
                responses.push(response);
                return response;
            })
            .then((actualRequest: object) => {
                expect(actualRequest).toEqual({request: "PING3"});
                const response = {response: "PONG3"};
                responses.push(response);
                return response;
            })
            .then((actualRequest: object) => {
                expect(actualRequest).toEqual({request: "PING4"});
                const response = {response: "PONG4"};
                responses.push(response);
                return response;
            })
            .then((actualRequest: object) => {
                expect(actualRequest).toEqual({request: "PING5"});
                const response = {response: "PONG5"};
                responses.push(response);
                return response;
            });
        
        pingPongService.send({request: "PING1"})
            .then((actualResponse: object) => {
                expect(actualResponse).toEqual({response: "PONG1"});
                const request = {request: "PING2"};
                requests.push(request);
                return request;
            })
            .then((actualResponse: object) => {
                expect(actualResponse).toEqual({response: "PONG2"});
                const request = {request: "PING3"};
                requests.push(request);
                return request;
            })
            .then((actualResponse: object) => {
                expect(actualResponse).toEqual({response: "PONG3"});
                const request = {request: "PING4"};
                requests.push(request);
                return request;
            })
            .then((actualResponse: object) => {
                expect(actualResponse).toEqual({response: "PONG4"});
                const request = {request: "PING5"};
                requests.push(request);
                return request;
            })
            .then((actualResponse: object) => {
                expect(actualResponse).toEqual({response: "PONG5"});
                resolve();
            });
    });

    await promise;

    expect(requests).toEqual([
        {request: "PING2"},
        {request: "PING3"},
        {request: "PING4"},
        {request: "PING5"}
    ]);

    expect(responses).toEqual([
        {response: "PONG1"},
        {response: "PONG2"},
        {response: "PONG3"},
        {response: "PONG4"},
        {response: "PONG5"}
    ]);
});

// // --------------------------------------------------------------------------------------------------------------------
