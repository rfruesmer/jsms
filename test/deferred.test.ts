import { Deferred } from "@/deferred";
import { ResolveFunction } from "@/jsms-deferred";

// --------------------------------------------------------------------------------------------------------------------

test("a deferred can be resolved", (done) => {
    const deferred = new Deferred<string>();
    deferred.then((value: string) => {
        expect(value).toEqual("PING");
        done();
    });

    deferred.resolve("PING");
});

// --------------------------------------------------------------------------------------------------------------------

test("a deferred can return a value", (done) => {
    const deferred = new Deferred<string>();
    deferred.then((value: string) => {
        expect(value).toEqual("PING");
        done();
        return "PONG";
    });

    deferred.resolve("PING");
});

// --------------------------------------------------------------------------------------------------------------------

class PingPongService {
    private receivers = new Array<Deferred<object>>();
    private senders = new Array<Deferred<object>>();

    constructor(private done: any) {}

    public receive(): Deferred<object> {
        const receiver = this.createReceiverDeferred();
        receiver.id = "Receiver";

        return receiver;
    }

    private createReceiverDeferred(): Deferred<object> {
        const receiverDeferred = new Deferred<object>((_receiverDeferred: any, receiverDeferredNext: any) => {
            this.onReceiverChained(_receiverDeferred, receiverDeferredNext);
        });
        this.receivers.push(receiverDeferred);

        return receiverDeferred;
    }
    
    private onReceiverChained = (receiverDeferred: any, receiverDeferredNext: any): void => {
        if (!receiverDeferredNext) {
            return;
        }

        this.receivers.push(receiverDeferredNext);

        receiverDeferredNext.onChained = (_receiverDeferredNext: any, receiverDeferredNextNext: any) => {
            this.receivers.push(receiverDeferredNextNext);
            receiverDeferredNextNext.onChained = this.onReceiverChained;
            receiverDeferredNextNext.promise.then((value: object) => {
                console.log(value);
            });
        };
    }

    public send(message: object): Deferred<object> {
        const sender = this.createSenderDeferred();
        sender.id = "Sender";

        this.resolve(message);

        return sender;
    }

    private createSenderDeferred(): Deferred<object> {
        const senderDeferred = new Deferred<object>((_senderDeferred: any, senderDeferredNext: any) => {
            this.onSenderChained(_senderDeferred, senderDeferredNext);
        });
        this.senders.push(senderDeferred);

        return senderDeferred;
    }
    
    private onSenderChained = (_senderDeferred: any, senderDeferredNext: any): void => {
        if (!senderDeferredNext) {
            return;
        }

        this.senders.push(senderDeferredNext);

        senderDeferredNext.onChained = (_senderDeferredNext: any, senderDeferredNextNext: any) => {
            this.senders.push(senderDeferredNextNext);
            senderDeferredNextNext.onChained = this.onSenderChained;
            senderDeferredNextNext.promise.then((value: object) => {
                console.log(value);
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

            if (receiver.result && senderNext) {
                // if (senderNext.next) {
                //     this.senders.push(senderNext.next);
                // }
                senderNext.resolve(receiver.result);
                senderNext.promise.then((_value: object) => {
                    if (senderNext.result) {
                        this.resolve(senderNext.result);
                    }
                });
            }
        });
    }
}
// --------------------------------------------------------------------------------------------------------------------

test("ping-pong", (done) => {

    const pingPongService = new PingPongService(done);

    pingPongService.receive()
        .then((message: object) => {
            expect(message).toEqual({request: "PING1"});
            return {response: "PONG1"};
        })
        .then((message: object) => {
            expect(message).toEqual({request: "PING2"});
            return {response: "PONG2"};
        })
        .then((message: object) => {
            expect(message).toEqual({request: "PING3"});
            return {response: "PONG3"};
        })
        .then((message: object) => {
            expect(message).toEqual({request: "PING4"});
            return {response: "PONG4"};
        })
        .then((message: object) => {
            expect(message).toEqual({request: "PING5"});
            return {response: "PONG5"};
        });
    
    pingPongService.send({request: "PING1"})
        .then((response: object) => {
            expect(response).toEqual({response: "PONG1"});
            return {request: "PING2"};
        })
        .then((response: object) => {
            expect(response).toEqual({response: "PONG2"});
            return {request: "PING3"};
        })
        .then((response: object) => {
            expect(response).toEqual({response: "PONG3"});
            return {request: "PING4"};
        })
        .then((response: object) => {
            expect(response).toEqual({response: "PONG4"});
            return {request: "PING5"};
        })
        .then((response: object) => {
            expect(response).toEqual({response: "PONG5"});
            done();
        });

});

// // --------------------------------------------------------------------------------------------------------------------
