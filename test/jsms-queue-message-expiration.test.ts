// import { JsmsService } from "@/jsms-service";
// import { JsmsMessage } from "@/jsms-message";
// import { FakeConnection } from "./fake-connection";

// let messageService: JsmsService;

// // --------------------------------------------------------------------------------------------------------------------

// beforeEach(() => {
//     messageService = new JsmsService();
// });

// // --------------------------------------------------------------------------------------------------------------------

// afterEach(() => {
//     // release resources
//     messageService.close();
// });

// // --------------------------------------------------------------------------------------------------------------------

// test("a queue doesn't deliver messages that expire inbetween sending and receiving", async () => {
//     const queueName = "/some/queue";
//     const messageBody = { test: "foo" };
//     let receivedExpiredMessage = false;

//     // given the message is sent before the receiver is running and not expired yet 
//     const timeToLiveMillis = 100;
//     const deferredResponse = messageService.send(queueName, messageBody, timeToLiveMillis);

//     // and the message expires
//     const expiration = new Promise((resolve, reject) => {
//         setTimeout(() => { resolve(); }, 150);
//     });
//     await expiration;
    
//     // when receiving the next message
//     messageService.receive(queueName)
//         .then((message: JsmsMessage) => {
//             receivedExpiredMessage = true;
//         });

//     // then the delivery should be rejected
//     await expect(deferredResponse.promise).rejects.toEqual("message expired");

//     // and the message shouldn't be delivered
//     expect(receivedExpiredMessage).toBeFalsy();
// });

// // --------------------------------------------------------------------------------------------------------------------

// test("a queue doesn't deliver messages that are expired before being send", async () => {
//     const queueName = "/some/queue";
//     const connection = new FakeConnection();
//     const queue = messageService.createQueue(queueName, connection);
//     const producer = connection.getProducer(queue);
//     let receivedExpiredMessage = false;

//     // given a receiver is already running 
//     messageService.receive(queueName)
//         .then((message: JsmsMessage) => {
//             receivedExpiredMessage = true;
//         });

//     // and a message that is expired before being send
//     const timeToLiveMillis = 1;
//     const expiredMessage = JsmsMessage.create(queueName, { test: "foo" }, timeToLiveMillis);
//     const expiration = new Promise((resolve, reject) => {
//         setTimeout(() => {resolve();}, 10);
//     });
//     await expiration;

//     // when trying to send the message
//     const deferredResponse = producer.send(expiredMessage);
        
//     // then the delivery should be rejected
//     await expect(deferredResponse.promise).rejects.toEqual("message expired");

//     // and the message shouldn't be delivered
//     expect(receivedExpiredMessage).toBeFalsy();
// });

// // --------------------------------------------------------------------------------------------------------------------

test("default", () => {
    const x = 1;
});

// --------------------------------------------------------------------------------------------------------------------
