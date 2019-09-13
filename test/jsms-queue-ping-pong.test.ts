// let messageService: JsmsService;
// const queueName = "/some/queue";

// // --------------------------------------------------------------------------------------------------------------------

// beforeEach(() => {
//     messageService = new JsmsService();
// });

// // --------------------------------------------------------------------------------------------------------------------

// afterEach(() => {
//     messageService.close();
// });

// // --------------------------------------------------------------------------------------------------------------------

// class PingPongServer {
//     public receive(): void {
//         messageService.receive(queueName)
//             .then((message: JsmsMessage, resolve: ResolveFunction<object>) => {
//                 expect(message.body).toEqual({request: "PING1"});
//                 resolve({response: "PONG1"});
//             })
//             .then((response: JsmsMessage, resolve: ResolveFunction<object>) => {
// //                expect(response.body).toEqual({request: "PING2"});
//                 console.log(response);
//                 resolve({response: "PONG2"});
//             });
//     }
// }

// // --------------------------------------------------------------------------------------------------------------------

// class PingPongClient {
//     private pingCount = 0;
    
//     constructor(private done: any) {}

//     public sendPing(): void {
//         messageService.send(queueName, {request: "PING1"})
//             .then((response: JsmsMessage, resolve: ResolveFunction<object>) => {
// //                expect(response.body).toEqual({request: "PONG1"});
//                 console.log(response);
//                 resolve({request: "PING2"});
//             })
//             .then((response: JsmsMessage, resolve: ResolveFunction<object>) => {
//                 console.log(response);
//             });
//     }
// }

// --------------------------------------------------------------------------------------------------------------------

// class FakeMessageService {
//     private channelName = "/some/queue";

//     public send(messageBody: object): Promise<object> {
//         const deferred = this.createDeferred("Sender", messageBody);
//         deferred.resolve(messageBody);
//         return deferred.promise;
//     }

//     private createDeferred(id: string, messageBody: object): Deferred {
//         const deferred = new Deferred();
//         deferred.id = id;
//         deferred.promise = new Promise<object>((resolve: any) => {
//             deferred.resolve = resolve;
//         });
//         deferred.promise.then((value: object) => {
//             const _id = deferred.id;
//             console.log(_id);
//         });
//         return deferred;
//     }

//     public receive(): Promise<object> {
//         const deferred = this.createDeferred("Receiver", {});
//         return deferred.promise;
//     }
// }

// --------------------------------------------------------------------------------------------------------------------

// test("queue messaging supports chaining aka ping-pong", (done) => {
    
//     const messageService = new FakeMessageService();
//     messageService.receive()
//         .then((message: object) => {
//             return {response: "PONG1"};
//         })
//         .then((value: any) => {
//             console.log(value);
//         });

//     messageService.send({request: "PING1"})
//         .then((message: object) => {
//             console.log(message);
// //            message.resolve({response: "PING2"});
//         })
//         .then((value: any) => {
//             console.log(value);
//         });

// }, 60000);

// --------------------------------------------------------------------------------------------------------------------

 test("dummy", () => {
     // OK
 });