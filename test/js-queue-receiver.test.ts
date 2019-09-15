import { JsQueueReceiver } from "@/js-queue-receiver";
import { JsmsMessage } from "@/jsms-message";
import { JsmsQueue } from "@/jsms-queue";
import { FakeConnection } from "./fake-connection";

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
