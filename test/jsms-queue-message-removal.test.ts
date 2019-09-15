import { JsmsService } from "@/jsms-service";
import { JsmsMessage } from "@/jsms-message";
import { FakeConnection } from "./fake-connection";

let messageService: JsmsService;

// --------------------------------------------------------------------------------------------------------------------

beforeEach(() => {
    messageService = new JsmsService();
});

// --------------------------------------------------------------------------------------------------------------------

afterEach(() => {
    // release resources
    messageService.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("a queued message is deleted after successful delivery when the listener sends a reply", async (done) => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedResponseBody = { response: "ACK" };
    let secondDelivery = false;

    // given the message is sent before the receiver is running
    const deferredResponse = messageService.send(queueName, messageBody);

    // when the receiver connects and replies
    messageService.receive(queueName)
        .then((message: JsmsMessage) => {
            return expectedResponseBody;
        });

    const response = await deferredResponse.promise;
    expect(response.body).toEqual(expectedResponseBody);

    // then the queue should be empty and the message shouldn't be delivered again
    messageService.receive(queueName)
        .then((message: JsmsMessage) => {
            secondDelivery = true;
        });

    setTimeout(() => {
        expect(secondDelivery).toBeFalsy();
        done();
    }, 100);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queued message is deleted after successful delivery when the listener doesn't send a reply", async (done) => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedResponseBody = {};
    let secondDelivery = false;

    // given the message is sent before the receiver is running
    const deferredResponse = messageService.send(queueName, messageBody);

    // when the receiver connects
    messageService.receive(queueName);
    const response = await deferredResponse.promise;
    expect(response.body).toEqual(expectedResponseBody);

    // then the queue should be empty and the message shouldn't be delivered again
    messageService.receive(queueName)
        .then((message: JsmsMessage) => {
            secondDelivery = true;
        });

    setTimeout(() => {
        expect(secondDelivery).toBeFalsy();
        done();
    }, 100);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queued message is deleted after successful delivery even when the listener throws an error", async (done) => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedError = new Error("which should be caught")
    let secondDelivery = false;

    // given the message is sent before the receiver is running
    const deferredResponse = messageService.send(queueName, messageBody);

    // when the receiver connects and replies with an error 
    messageService.receive(queueName)
        .then((message: JsmsMessage) => {
            // NOTE: the message is now considered to be sucessfully delivered 
            // Any errors during consuming the message mustn't change the successful delivery status:
            throw expectedError;
        });

    await expect(deferredResponse.promise).rejects.toThrowError(expectedError);

    messageService.receive(queueName)
        .then((message: JsmsMessage) => {
            secondDelivery = true;
        });

    setTimeout(() => {
        expect(secondDelivery).toBeFalsy();
        done();
    }, 100);
});

// --------------------------------------------------------------------------------------------------------------------
