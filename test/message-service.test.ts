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

    messageService.send(queueName, messageBody, 1000);

    const expiration = new Promise((resolve, reject) => {
        setTimeout(() => {resolve()}, 1001);
    });

    await expiration;
    
    let received = false;

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