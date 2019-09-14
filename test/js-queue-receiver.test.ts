import { JsQueueReceiver } from "@/js-queue-receiver";
import { FakeConnection } from "./fake-connection";
import { JsmsQueue } from "@/jsms-queue";
import { JsmsMessage } from "@/jsms-message";
import { JsmsDeferred } from "@/jsms-deferred";

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver dispatches non-expired messages with valid channel name", () => {
    const queue = new JsmsQueue("/some/queue");
    const connection = new FakeConnection();
    const queueReceiver = new JsQueueReceiver(connection, queue);
    const expectedMessage = JsmsMessage.create("/some/queue", {test: "foo"}, 0);
    let actualMessage: JsmsMessage | null = null;

    queueReceiver.receive().then((message: JsmsMessage) => {
        actualMessage = message;    
    });

    const result = queueReceiver.onMessage(expectedMessage);

    queue.close();
    
    expect(result).toBeTruthy();
    expect(actualMessage).toBeDefined();
    // @ts-ignore: actualMessage is guaruanteed to be valid now
    expect(actualMessage.body).toEqual(expectedMessage.body);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver doesn't dispatch expired messages", async () => {
    const queue = new JsmsQueue("/some/queue");
    const connection = new FakeConnection();
    const queueReceiver = new JsQueueReceiver(connection, queue);
    const expectedMessage = JsmsMessage.create("/some/queue", {test: "foo"}, 10);
    let actualMessage: JsmsMessage | null = null;

    queueReceiver.receive().then((message: JsmsMessage) => {
        actualMessage = message;    
    });

    const expiration = new Promise((resolve, reject) => {
        setTimeout(() => {resolve();}, 100);
    });
    await expiration;

    const promise = queueReceiver.onMessage(expectedMessage).promise;

    queue.close();
    
    await expect(promise).rejects.toEqual("message expired");
    expect(actualMessage).toBeNull();
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver doesn't dispatch messages with a different channel name", async  () => {
    const queue = new JsmsQueue("/some/queue");
    const connection = new FakeConnection();
    const queueReceiver = new JsQueueReceiver(connection, queue);
    const expectedMessage = JsmsMessage.create("/some/different/queue", {test: "foo"}, 0);
    let actualMessage: JsmsMessage | null = null;

    queueReceiver.receive().then((message: JsmsMessage) => {
        actualMessage = message;    
    });

    const promise = queueReceiver.onMessage(expectedMessage).promise;

    queue.close();
    
    await expect(promise).rejects.toEqual("invalid channel");
    expect(actualMessage).toBeNull();
});

// --------------------------------------------------------------------------------------------------------------------
