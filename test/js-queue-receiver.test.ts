import { JsQueueReceiver } from "../src/internal/js-queue-receiver";
import { JsmsMessage } from "../src/jsms-message";
import { JsmsQueue } from "../src/jsms-queue";
import { FakeConnection } from "./fake-connection";
import { JsmsService } from "../src/jsms-service";

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

test("a queue receiver dispatches non-expired messages with valid channel name", async () => {
    const queue = new JsmsQueue("/some/queue");
    const connection = new FakeConnection();
    const queueReceiver = new JsQueueReceiver(connection, queue);
    const expectedMessage = JsmsMessage.create("/some/queue", {test: "foo"}, 0);
    let actualMessage = JsmsMessage.create("", {});

    // given queue receiver
    const deferredDelivery = queueReceiver.receive();
    deferredDelivery.then((message: JsmsMessage) => {
        actualMessage = message;    
    });

    // when a messages is sent
    queueReceiver.onMessage(expectedMessage);
    await deferredDelivery.promise;
    
    // then it should be dispatched to the receiver
    expect(actualMessage).toBeDefined();
    expect(actualMessage.body).toEqual(expectedMessage.body);

    // release resources
    queue.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver doesn't dispatch expired messages and rejects the promise", async () => {
    const queue = new JsmsQueue("/some/queue");
    const connection = new FakeConnection();
    const queueReceiver = new JsQueueReceiver(connection, queue);
    let actualMessage: JsmsMessage | null = null;

    // given message that expires really soon
    const timeToLiveMillis = 1;
    const expectedMessage = JsmsMessage.create("/some/queue", {test: "foo"}, timeToLiveMillis);

    // and a running queue receiver
    queueReceiver.receive().then((message: JsmsMessage) => {
        actualMessage = message;    
    });

    // when the message is expired
    const expiration = new Promise((resolve, reject) => {
        setTimeout(() => {resolve();}, 100);
    });
    await expiration;

    // and someone tries to dispatch this expired message
    const deferredResponse = queueReceiver.onMessage(expectedMessage);
    
    // then the promise should be rejected
    await expect(deferredResponse.promise).rejects.toEqual("message expired");

    // and the message mustn't be delivered
    expect(actualMessage).toBeNull();

    // release resources
    queue.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver doesn't dispatch messages with a different channel name", async () => {
    const queue = new JsmsQueue("/some/queue");
    const connection = new FakeConnection();
    const queueReceiver = new JsQueueReceiver(connection, queue);
    let actualMessage: JsmsMessage | null = null;

    // given a running queue receiver
    queueReceiver.receive().then((message: JsmsMessage) => {
        actualMessage = message;    
    });

    // and a message with a different destination
    const uninterestingMessage = JsmsMessage.create("/some/different/queue", {test: "foo"}, 0);

    // when the message is send
    const deferredResponse = queueReceiver.onMessage(uninterestingMessage);
    
    // then the promise should be rejected
    await expect(deferredResponse.promise).rejects.toEqual("invalid channel");

    // and the message mustn't be delivered
    expect(actualMessage).toBeNull();

    // release resources
    queue.close();
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
    const expectedError = new Error("which should be caught");
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
