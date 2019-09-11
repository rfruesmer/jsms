import { FakeMessageProducer } from "./fake-message-producer";
import { FakeMessageConsumer } from "./fake-message-consumer";
import { FakeConnection } from "./fake-connection";
import { JsmsService } from "@/jsms-service";
import { JsConnection } from "@/js-connection";
import { JsmsMessage } from "@/jsms-message";
import { ResolveFunction } from "@/jsms-deferred";
import { FakeCustomMessage } from "./fake-custom-message";

// TODO: convert to BDD tests - encapsulate setups/execution/verification in given/when/then where possible
// TODO: split up into separate tests for PTP/pub-sub, message service and components

let messageService: JsmsService;

// --------------------------------------------------------------------------------------------------------------------

beforeEach(() => {
    messageService = new JsmsService();
});

// --------------------------------------------------------------------------------------------------------------------

afterEach(() => {
    messageService.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue delivers a message immediately if a receiver is already registered", async () => {
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

test("a queue delivers any number of messages immediately if one or more receivers are already registered", async () => {
    const queueName = "/some/queue";
    const firstExpectedMessageBody = { test: "1" };
    const secondExpectedMessageBody = { test: "2" };
    const thirdExpectedMessageBody = { test: "3" };

    const firstMessagePromise = messageService.receive(queueName).promise;
    const secondMessagePromise = messageService.receive(queueName).promise;
    const thirdMessagePromise = messageService.receive(queueName).promise;

    messageService.send(queueName, firstExpectedMessageBody);
    messageService.send(queueName, secondExpectedMessageBody);
    messageService.send(queueName, thirdExpectedMessageBody);

    const firstMessage = await firstMessagePromise;
    expect(firstMessage.body).toEqual(firstExpectedMessageBody);
    const secondMessage = await secondMessagePromise;
    expect(secondMessage.body).toEqual(secondExpectedMessageBody);
    const thirdMessage = await thirdMessagePromise;
    expect(thirdMessage.body).toEqual(thirdExpectedMessageBody);
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
test("a queue delivers any messages in correct order if one or more receivers are already registered", async () => {
    const queueName = "/some/queue";
    const firstExpectedMessageBody = { test: "1" };
    const secondExpectedMessageBody = { test: "2" };
    const thirdExpectedMessageBody = { test: "3" };

    const firstMessagePromise = messageService.receive(queueName).promise;
    const secondMessagePromise = messageService.receive(queueName).promise;

    messageService.send(queueName, firstExpectedMessageBody);

    const thirdMessagePromise = messageService.receive(queueName).promise;

    messageService.send(queueName, secondExpectedMessageBody);
    messageService.send(queueName, thirdExpectedMessageBody);

    const thirdMessage = await thirdMessagePromise;
    expect(thirdMessage.body).toEqual(thirdExpectedMessageBody);
    const secondMessage = await secondMessagePromise;
    expect(secondMessage.body).toEqual(secondExpectedMessageBody);
    const firstMessage = await firstMessagePromise;
    expect(firstMessage.body).toEqual(firstExpectedMessageBody);
});
    
// --------------------------------------------------------------------------------------------------------------------

test("message service creates a default body to queue messages if none was specified", async () => {
    const queueName = "/some/queue";
    const expectedMessageBody = {};

    const promise = messageService.receive(queueName).promise;
    messageService.send(queueName);

    const actualMessage = await promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver can send a response when the message is sent after registration of the receiver", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedResponseBody = { response: "payload" };

    messageService.receive(queueName)
        .then((message: JsmsMessage, resolve: ResolveFunction<object>) => {
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
        .then((message: JsmsMessage, resolve: ResolveFunction<object>) => {
            resolve(expectedResponseBody);
        });

    const response = await promise;
    expect(response.body).toEqual(expectedResponseBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue removes expired messages", async (done) => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    let receivedExpiredMessage = false;

    messageService.send(queueName, messageBody, 100);

    const expiration = new Promise((resolve, reject) => {
        setTimeout(() => {resolve()}, 150);
    });
    await expiration;
    
    messageService.receive(queueName)
        .then((message: JsmsMessage, resolve: ResolveFunction<object>) => {
            receivedExpiredMessage = true;
        });
    
    setTimeout(() => {
        expect(receivedExpiredMessage).toBeFalsy();
        done();
    }, 1);
});

// --------------------------------------------------------------------------------------------------------------------

test("a message queue catches exceptions thrown by consumers and then rejects the promise", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    
    const promise = messageService.send(queueName, messageBody);

    messageService.receive(queueName)
        .then((message: JsmsMessage, resolve: ResolveFunction<object>) => {
            throw new Error("which should be caught and reject the sender promise");
        });

    await expect(promise).rejects.toThrowError();
});

// --------------------------------------------------------------------------------------------------------------------

test("a queued message is deleted after successful delivery", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    let secondDelivery = false;

    const promise = messageService.send(queueName, messageBody);

    messageService.receive(queueName)
        .then((message: JsmsMessage, resolve: ResolveFunction<object>) => {
            // NOTE: the message is now considered to be sucessfully delivered 
            // Any errors during consuming the message mustn't change the successful delivery status:
            throw new Error("should be caught");
        });

    await expect(promise).rejects.toThrowError();

    messageService.receive(queueName)
        .then((message: JsmsMessage, resolve: ResolveFunction<object>) => {
            secondDelivery = true;
        });

    expect(secondDelivery).toBeFalsy();
});

// --------------------------------------------------------------------------------------------------------------------

// test("receiving queue messages is open for extension via custom connection", async () => {
//     const queueName = "/some/queue";
//     const expectedMessageBody = { test: "foo" };
//     const connection = new FakeConnection();
//     const queue = connection.createQueue(queueName);
//     const messageConsumer = connection.getConsumer(queue) as FakeMessageConsumer;
//     const promise = messageConsumer.receive().promise;

//     connection.onCustomMessageReceived(new FakeCustomMessage(queueName, expectedMessageBody));

//     const actualMessage = await promise;
//     expect(actualMessage.body).toEqual(expectedMessageBody);

//     queue.close();
// });

// --------------------------------------------------------------------------------------------------------------------

// test("the message service provides a facade for custom queue messaging", async () => {
//     const queueName = "/some/queue";
//     const expectedMessageBody = { test: "foo" };
//     const connection = new FakeConnection();
//     const queue = messageService.createQueue(queueName, connection);
//     const messageConsumer = connection.getConsumer(queue) as FakeMessageConsumer;
//     const promise = messageService.receive(queueName).promise;

//     connection.onCustomMessageReceived(new FakeCustomMessage(queueName, expectedMessageBody));

//     const actualMessage = await promise;
//     expect(actualMessage.body).toEqual(expectedMessageBody);

//     queue.close();
// });

// --------------------------------------------------------------------------------------------------------------------

// test("sending queue messages is open for extension via custom connection", async () => {
//     const queueName = "/some/queue";
//     const expectedMessageBody = { test: "foo" };
//     const connection = new FakeConnection();
//     const queue = messageService.createQueue(queueName, connection);
//     const messageProducer = connection.getProducer(queue) as FakeMessageProducer;
//     expect(messageProducer.getLastMessage()).toBeUndefined();
    
//     messageService.send(queueName, expectedMessageBody);

//     const lastMessage = messageProducer.getLastMessage();
//     expect(lastMessage).toBeDefined();
//     expect(lastMessage.body).toEqual(expectedMessageBody);

//     queue.close();
// });

// --------------------------------------------------------------------------------------------------------------------

test("topic subscription is open for extension via custom topic subscriber", async () => {
    const topicName = "/some/topic";
    const expectedMessageBody = { test: "foo" };

    // given custom message consumer for a given topic name
    const connection = new FakeConnection();
    const topic = messageService.createTopic(topicName, connection);
    const customTopicSubscriber = connection.getConsumer(topic) as FakeMessageConsumer;
    const promise = customTopicSubscriber.receive().promise;

    // when receiving a custom message
    connection.onCustomMessageReceived(new FakeCustomMessage(topicName, expectedMessageBody));

    // then the message should be published to the custom message consumer
    const actualMessage = await promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("message service integrates with custom topic subscriber", async () => {
    const topicName = "/some/topic";
    const expectedMessageBody = { test: "foo" };
    let actualMessageBody = {};

    // given custom connection incl. custom message consumer for given topic name
    const connection = new FakeConnection();
    const topic = messageService.createTopic(topicName, connection);

    // given subscriber for topic 
    const promise = messageService.subscribe(topicName, (message: JsmsMessage) => {
        actualMessageBody = message.body;
    });

    // when receiving a custom message
    connection.onCustomMessageReceived(new FakeCustomMessage(topicName, expectedMessageBody));

    // then the message should be published to the subscriber
    expect(actualMessageBody).toEqual(expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("message service integrates with custom topic publisher", async () => {
    const topicName = "/some/topic";
    const expectedMessageBody = { test: "foo" };

    // given custom message producer for a given topic name
    const connection = new FakeConnection();
    const topic = messageService.createTopic(topicName, connection);
    const messageProducer = connection.getProducer(topic) as FakeMessageProducer;
    expect(messageProducer.getLastMessage()).toBeUndefined();

    // when publishing a message to topic
    messageService.publish(topicName, expectedMessageBody);

    // then the custom message producer should have received the message
    const lastMessage = messageProducer.getLastMessage();
    expect(lastMessage).toBeDefined();
    expect(lastMessage.body).toEqual(expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a topic message is published to all subscribers exactly once", () => {
    const topicName = "/some/topic";
    const expectedMessageBody = { test: "foo" };
    let receivedCount = 0;

    messageService.subscribe(topicName, (actualMessage: JsmsMessage) => { 
        expect(actualMessage.body).toEqual(expectedMessageBody);
        receivedCount++; 
    });

    messageService.subscribe(topicName, (actualMessage: JsmsMessage) => { 
        expect(actualMessage.body).toEqual(expectedMessageBody);
        receivedCount++; 
    });

    messageService.publish(topicName, expectedMessageBody);

    expect(receivedCount).toBe(2);
});

// --------------------------------------------------------------------------------------------------------------------

test("a subscriber is called only once", () => {
    const topicName = "/some/topic";
    const messageBody = { test: "foo" };
    let receivedCount = 0;

    const subscriber = (message: JsmsMessage) => { receivedCount++; }
    messageService.subscribe(topicName, subscriber);
    messageService.subscribe(topicName, subscriber);

    messageService.publish(topicName, messageBody);

    expect(receivedCount).toBe(1);
});

// --------------------------------------------------------------------------------------------------------------------

test("a message is only published to it's topic subscribers", () => {
    let received = false;

    messageService.subscribe("/interesting/topic", (message: JsmsMessage) => { received = true });
    messageService.publish("/uninteresting/topic", {});

    expect(received).toBeFalsy();
});
   
// --------------------------------------------------------------------------------------------------------------------

test("message service creates default body to topic messages if none was specified", async () => {
    const topicName = "/some/topic";
    const expectedMessageBody = {};
    let actualMessageBody = null;

    messageService.subscribe(topicName, (message: JsmsMessage) => { 
        actualMessageBody = message.body;
    });
    messageService.publish(topicName);

    expect(actualMessageBody).toEqual(expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

// TODO: jsmessageproducer catches errors thrown by message listener

// TODO: test a queue doesn't deliver expired messages

// TODO: support for message listener

// TODO: support for multiple queues

// TODO: support for multiple topics

// TODO: add jsdoc

// TODO: receiveSync() (?)
