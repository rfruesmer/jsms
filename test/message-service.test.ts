import { Message } from "@/message";
import { MessageHeader } from "@/message-header";
import { MessageService } from "@/message-service";
import { Deferred, ResolveFunction } from "@/deferred";
import { promises } from "dns";


let messageService: MessageService;

// --------------------------------------------------------------------------------------------------------------------

beforeEach(() => {
    messageService = new MessageService();
});

// --------------------------------------------------------------------------------------------------------------------

afterEach(() => {
    messageService.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue allows only one receiver at a given time", () => {
    const queueName = "/some/queue";

    messageService.receive(queueName);
    expect(() => {
        messageService.receive(queueName)
    }).toThrow(Error);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue delivers a message immediately when the receiver is already registered", async () => {
    const queueName = "/some/queue";
    const expectedMessageBody = { test: "foo" };

    const promise = messageService.receive(queueName).promise;
    messageService.send(queueName, expectedMessageBody);

    const actualMessage = await promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("message service creates a default body if none was specified", async () => {
    const queueName = "/some/queue";
    const expectedMessageBody = {};

    const promise = messageService.receive(queueName).promise;
    messageService.send(queueName);

    const actualMessage = await promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver can fetch a pending message after registration", async () => {
    const queueName = "/some/queue";
    const expectedMessageBody = { test: "foo" };

    messageService.send(queueName, expectedMessageBody);

    const actualMessage = await messageService.receive(queueName).promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue delivers pending messages in the order they were sent", async () => {
    const queueName = "/some/queue";
    const firstExpectedMessageBody = { test: "1" };
    const secondExpectedMessageBody = { test: "2" };
    const thirdExpectedMessageBody = { test: "3" };

    messageService.send(queueName, firstExpectedMessageBody);
    messageService.send(queueName, secondExpectedMessageBody);
    messageService.send(queueName, thirdExpectedMessageBody);

    let actualMessage = await messageService.receive(queueName).promise;
    expect(actualMessage.body).toEqual(firstExpectedMessageBody);

    actualMessage = await messageService.receive(queueName).promise;
    expect(actualMessage.body).toEqual(secondExpectedMessageBody);

    actualMessage = await messageService.receive(queueName).promise;
    expect(actualMessage.body).toEqual(thirdExpectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver can send a response when the message is sent after registration of the receiver", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedResponseBody = { response: "payload" };

    messageService.receive(queueName)
        .then((message: Message, resolve: ResolveFunction<object>) => {
            resolve(expectedResponseBody);
        });

    const response = await messageService.send(queueName, messageBody);
    expect(response).toEqual(expectedResponseBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver can send a response when the message is sent before registration of the receiver", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedResponseBody = { response: "payload" };

    const promise = messageService.send(queueName, messageBody);

    messageService.receive(queueName)
        .then((message: Message, resolve: ResolveFunction<object>) => {
            resolve(expectedResponseBody);
        });

    const response = await promise;
    expect(response).toEqual(expectedResponseBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue removes expired messages", async (done) => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    let received = false;

    messageService.send(queueName, messageBody, 1000);

    const expiration = new Promise((resolve, reject) => {
        setTimeout(() => {resolve()}, 1100);
    });

    await expiration;
    
    messageService.receive(queueName)
        .then((message: Message, resolve: ResolveFunction<object>) => {
            received = true;
        });
    
    setTimeout(() => {
        expect(received).toBeFalsy();
        done();
    }, 1);
});

// --------------------------------------------------------------------------------------------------------------------

test("a message queue catches exceptions thrown by consumers and rejects the promise", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedResponseBody = { response: "payload" };

    const promise = messageService.send(queueName, messageBody);

    messageService.receive(queueName)
        .then((message: Message, resolve: ResolveFunction<object>) => {
            throw new Error("should be caught");
        });

    await expect(promise).rejects.toThrowError();
});

// --------------------------------------------------------------------------------------------------------------------

test("a message is deleted after successful delivery", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedResponseBody = { response: "payload" };
    let secondDelivery = false;

    const promise = messageService.send(queueName, messageBody);

    messageService.receive(queueName)
        .then((message: Message, resolve: ResolveFunction<object>) => {
            // NOTE: the message is now considered to be sucessfully delivered 
            // Any errors during consuming the message mustn't change the successful delivery status:
            throw new Error("should be caught");
        });

    await expect(promise).rejects.toThrowError();

    messageService.receive(queueName)
        .then((message: Message, resolve: ResolveFunction<object>) => {
            secondDelivery = true;
        });

    expect(secondDelivery).toBeFalsy();
});

// --------------------------------------------------------------------------------------------------------------------

test("a message is published to all subscribers", () => {
    const topic = "/some/topic";
    const messageBody = { test: "foo" };
    let receivedCount = 0;

    messageService.subscribe(topic, (message: Message) => { receivedCount++; });
    messageService.subscribe(topic, (message: Message) => { receivedCount++; });

    messageService.publish(topic, messageBody);

    expect(receivedCount).toBe(2);
});

// --------------------------------------------------------------------------------------------------------------------

test("a subscriber is only called once", () => {
    const topic = "/some/topic";
    const messageBody = { test: "foo" };
    let receivedCount = 0;

    const subscriber = (message: Message) => { receivedCount++; }
    messageService.subscribe(topic, subscriber);
    messageService.subscribe(topic, subscriber);

    messageService.publish(topic, messageBody);

    expect(receivedCount).toBe(1);
});

// --------------------------------------------------------------------------------------------------------------------

test("a message is only published to topic subscribers", () => {
    let received = false;

    messageService.subscribe("/interesting/topic", (message: Message) => { received = true });
    messageService.publish("/uninteresting/topic", {});

    expect(received).toBeFalsy();
});
   
// --------------------------------------------------------------------------------------------------------------------

