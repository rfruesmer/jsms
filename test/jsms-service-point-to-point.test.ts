import { JsQueueReceiver } from "../src/internal/js-queue-receiver";
import { JsmsMessage } from "../src/jsms-message";
import { JsmsQueue } from "../src/jsms-queue";
import { JsmsService } from "../src/jsms-service";
import { FakeConnection } from "./fake-connection";
import { FakeCustomMessage } from "./fake-custom-message";


let messageService: JsmsService;

// --------------------------------------------------------------------------------------------------------------------

function expectConsumerToBeEmpty(queueName: string): void {
    const queue = messageService.getQueue(queueName);
    const connection = messageService.getConnection(queue);
    const consumer = connection.getConsumer(queue);
    expect((consumer as JsQueueReceiver).isEmpty()).toBeTruthy();
}

// --------------------------------------------------------------------------------------------------------------------

beforeEach(() => {
    messageService = new JsmsService();
});

// --------------------------------------------------------------------------------------------------------------------

afterEach(() => {
    // sanity check
    expectConsumerToBeEmpty("/some/queue");

    // release resources
    messageService.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver can fetch a message even when it's running before the client sends the message", async () => {
    const queueName = "/some/queue";
    const expectedMessageBody = { test: "foo" };

    // given a receiver is present
    const deferredDelivery = messageService.receive(queueName);

    // when a message is sent
    messageService.send(queueName, expectedMessageBody);

    /// then the listener should have received the message
    const actualMessage = await deferredDelivery.promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver can fetch a message even when it wasn't running when the client sent the message", async () => {
    const queueName = "/some/queue";
    const expectedMessageBody = { test: "foo" };

    // given the message was sent before the receiver is running
    messageService.send(queueName, expectedMessageBody);

    // when the message is fetched 
    const deferredDelivery = messageService.receive(queueName);

    // then the message should be received
    const actualMessage = await deferredDelivery.promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("multiple queue receivers can fetch messages in correct order when they are running before the client sends the messages", async () => {
    const queueName = "/some/queue";
    const firstExpectedMessageBody = { test: "1" };
    const secondExpectedMessageBody = { test: "2" };
    const thirdExpectedMessageBody = { test: "3" };

    // given multiple receivers are present
    const firstMessagePromise = messageService.receive(queueName).promise;
    const secondMessagePromise = messageService.receive(queueName).promise;
    const thirdMessagePromise = messageService.receive(queueName).promise;

    // when the messages are send
    messageService.send(queueName, firstExpectedMessageBody);
    messageService.send(queueName, secondExpectedMessageBody);
    messageService.send(queueName, thirdExpectedMessageBody);

    // then the messages should be received in correct order
    const firstMessage = await firstMessagePromise;
    expect(firstMessage.body).toEqual(firstExpectedMessageBody);
    const secondMessage = await secondMessagePromise;
    expect(secondMessage.body).toEqual(secondExpectedMessageBody);
    const thirdMessage = await thirdMessagePromise;
    expect(thirdMessage.body).toEqual(thirdExpectedMessageBody);
});
    
// --------------------------------------------------------------------------------------------------------------------

test("multiple queue receivers can fetch messages in correct order even when they weren't running before the client sends the messages", async () => {
    const queueName = "/some/queue";
    const firstExpectedMessageBody = { test: "1" };
    const secondExpectedMessageBody = { test: "2" };
    const thirdExpectedMessageBody = { test: "3" };

    // given the messages are sent before the receivers are running
    messageService.send(queueName, firstExpectedMessageBody);
    messageService.send(queueName, secondExpectedMessageBody);
    messageService.send(queueName, thirdExpectedMessageBody);

    // when the message are fetched 
    const firstMessage = await messageService.receive(queueName).promise;
    const secondMessage = await messageService.receive(queueName).promise;
    const thirdMessage = await messageService.receive(queueName).promise;

    // then the messages should be received in correct order
    expect(firstMessage.body).toEqual(firstExpectedMessageBody);
    expect(secondMessage.body).toEqual(secondExpectedMessageBody);
    expect(thirdMessage.body).toEqual(thirdExpectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue delivers any messages in correct order if one or more receivers are already running", async () => {
    const queueName = "/some/queue";
    const firstExpectedMessageBody = { test: "1" };
    const secondExpectedMessageBody = { test: "2" };
    const thirdExpectedMessageBody = { test: "3" };

    // given a couple of receivers are already running
    const firstMessagePromise = messageService.receive(queueName).promise;
    const secondMessagePromise = messageService.receive(queueName).promise;

    // when a message is send
    messageService.send(queueName, firstExpectedMessageBody);

    // and another receiver is connecting
    const thirdMessagePromise = messageService.receive(queueName).promise;

    // and another couple of message are send
    messageService.send(queueName, secondExpectedMessageBody);
    messageService.send(queueName, thirdExpectedMessageBody);

    // then the messages should be received in correct order
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

    // given a receiver is already running
    const deferredDelivery = messageService.receive(queueName);

    // when a message is send without a body
    messageService.send(queueName);

    // then the message body should be a defined, empty object
    const actualMessage = await deferredDelivery.promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver can chain a 'reply-then' when it's running before the message is send", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedResponseBody = { response: "ACK" };

    // given a receiver is already running and will be replying to a message
    messageService.receive(queueName)
        .then((message: JsmsMessage) => {
            return expectedResponseBody;
        });

    // when the message is send and a response is awaited
    const deferredResponse = messageService.send(queueName, messageBody);
    const response = await deferredResponse.promise;

    // then the expected response should be delivered
    expect(response.body).toEqual(expectedResponseBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver can send a response when the message is sent before the receiver is running", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedResponseBody = { response: "ACK" };

    // given the message is sent before the receiver is running
    const deferredResponse = messageService.send(queueName, messageBody);

    // when the receiver connects
    messageService.receive(queueName)
        .then((message: JsmsMessage) => {
            return expectedResponseBody;
        });

    // then the sender should have received the response
    const response = await deferredResponse.promise;
    expect(response.body).toEqual(expectedResponseBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a deferred response gets resolved with an empty body when the receiver doesn't send a response", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedResponseBody = {};

    // given a receiver is already running and won't reply the next message
    messageService.receive(queueName);

    // when the message is send and awaited to be delivered
    const deferredResponse = messageService.send(queueName, messageBody);
    const response = await deferredResponse.promise;

    // then the response deferred should be resolved
    expect(response.body).toEqual(expectedResponseBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("JsMessageProducer catches errors thrown by message listeners that were already running before sending and rejects the promise", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedError = new Error("which should be caught");
    let actualError;

    // given a receiver will throw an error while receiving a message
    messageService.receive(queueName)
        .then((message: JsmsMessage) => {
            throw expectedError;
        });

    // when the message is send
    const deferredResponse = messageService.send(queueName, messageBody);
    deferredResponse.catch((reason: any) => {
        actualError = reason;
    });

    // then the promise should have been rejected
    await expect(deferredResponse.promise).rejects.toThrowError(expectedError);

    // and the error should have been propagated to the sender
    expect(actualError).toEqual(expectedError);
});

// --------------------------------------------------------------------------------------------------------------------

test("JsMessageProducer catches errors thrown by message listeners that run only after sending and rejects the promise", async () => {
    const queueName = "/some/queue";
    const messageBody = { test: "foo" };
    const expectedError = new Error("which should be caught");
    let actualError;
    
    // given the message is sent before the receiver is running
    const deferredResponse = messageService.send(queueName, messageBody);
    deferredResponse.catch((reason: any) => {
        actualError = reason;
    });

    // when the receiver connects 
    messageService.receive(queueName)
        .then((message: JsmsMessage) => {
            throw expectedError;
        });

    // then the promise should have been rejected
    await expect(deferredResponse.promise).rejects.toThrowError(expectedError);

    // and the error should have been propagated to the sender
    expect(actualError).toEqual(expectedError);
});

// --------------------------------------------------------------------------------------------------------------------

test("queue is open for extension via custom queue receiver", async () => {
    const queueName = "/some/queue";
    const expectedMessageBody = { test: "foo" };

    // given custom queue receiver for a given queue name
    const connection = new FakeConnection();
    const queue = connection.createQueue(queueName);
    const customQueueReceiver = connection.getConsumer(queue) as JsQueueReceiver;

    // when receiving a custom message
    const deferredDelivery = customQueueReceiver.receive();

    // and a custom message enters the connection
    connection.onCustomMessageReceived(new FakeCustomMessage(queueName, expectedMessageBody));

    // then the message should be sent to the custom queue receiver
    const actualMessage = await deferredDelivery.promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);

    queue.close();
});

// --------------------------------------------------------------------------------------------------------------------
    
test("message service integrates with custom queue receiver", async () => {
    const queueName = "/some/queue";
    const expectedMessageBody = { test: "foo" };

    // given custom queue receiver for a given queue name
    const connection = new FakeConnection();
    const queue = messageService.createQueue(queueName, connection);

    // when receiving a custom message
    const deferredDelivery = messageService.receive(queueName);

    // and a custom message enters the connection
    connection.onCustomMessageReceived(new FakeCustomMessage(queueName, expectedMessageBody));

    // then the message should be sent to the custom queue receiver
    const actualMessage = await deferredDelivery.promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);

    queue.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("message service integrates with custom queue sender", async () => {
    const queueName = "/some/queue";
    const expectedMessageBody = { test: "foo" };

    // given custom queue sender for a given queue name
    const connection = new FakeConnection();
    const queue = messageService.createQueue(queueName, connection);

    // and the connection didn't receive anything yet
    expect(connection.getLastSentMessage()).toBeUndefined();
    
    // when the message is send over the message service facade
    messageService.send(queueName, expectedMessageBody);

    // and a receiver connects (this is mainly done for this test to pass the remaining references check in afterEach) 
    const deferredDelivery = messageService.receive(queueName);
    const actualMessage = await deferredDelivery.promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);

    // then it should be dispatched to the connection
    const lastMessage = connection.getLastSentMessage();
    expect(lastMessage).toBeDefined();
    expect(lastMessage.body).toEqual(expectedMessageBody);

    queue.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue doesn't add the same expired listener twice", async () => {
    let invocationCount = 0;

    // given a queue
    const queue = new JsmsQueue("/some/queue");

    // and a message that expires soon is sent to the queue
    const messageThatWillExpireSoon = JsmsMessage.create("/some/queue", {}, 100);
    queue.enqueue(messageThatWillExpireSoon);

    // and the same expiration listener is added twice to the queue
    const messageExpiredListener = (message: JsmsMessage) => {
        invocationCount++;
    };
    queue.addMessageExpiredListener(messageExpiredListener);
    queue.addMessageExpiredListener(messageExpiredListener);

    // when the message expires
    const expiration = new Promise((resolve, reject) => {
        setTimeout(() => {resolve();}, 1000);
    });
    await expiration;

    // then the listener should be called only once
    expect(invocationCount === 1);

    queue.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("message service retries delivering a message until the producer is ready or the message expires", async () => {
    const queueName = "/some/queue";
    const messageBody = { request: "PING" };
    const expectedResponseBody = { response: "PONG" };

    // given custom connection which will become available only after 3 seconds
    const connection = new FakeConnection();
    connection.simulateDelayedAvailability(3000);
    messageService.createQueue(queueName, connection);

    // when sending a message and awaiting a response
    const deferredResponse = messageService.send(queueName, messageBody);
    const actualResponse = await deferredResponse.promise;

    // then the expected response should be received
    expect(actualResponse.body).toEqual(expectedResponseBody);

    messageService.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("message service stops retrying to deliver a message when the message expires", async () => {
    const queueName = "/some/queue";
    const messageBody = { request: "PING" };

    // given custom connection which will become available only after 5 seconds
    const connection = new FakeConnection();
    connection.simulateDelayedAvailability(5000);
    messageService.createQueue(queueName, connection);

    // when sending a message that expires after 3 seconds and awaiting a response
    const deferredResponse = messageService.send(queueName, messageBody, 3000);

    // then the request should be rejected
    await expect(deferredResponse.promise).rejects.toEqual("message expired");

    messageService.close();
}, 10000);

// --------------------------------------------------------------------------------------------------------------------

test("message service stops retrying to deliver a message when max retry count is reached", async () => {
    const queueName = "/some/queue";
    const messageBody = { request: "PING" };

    // given custom connection which will become available only after 1 minute
    const connection = new FakeConnection();
    connection.simulateDelayedAvailability(60000);
    messageService.createQueue(queueName, connection);

    // when sending a message without expiration and awaiting a response
    const deferredResponse = messageService.send(queueName, messageBody);

    // then the request should be rejected
    await expect(deferredResponse.promise).rejects.toEqual("exceeded max retries");

    messageService.close();
}, 60000);

// --------------------------------------------------------------------------------------------------------------------

test("message queue supports reply/request chaining of deferreds", async () => {

    const receivedRequests = new Array<object>();
    const receivedResponses = new Array<object>();
    const queueName = "/some/queue";

    const promise = new Promise<void>((resolve) => {
        messageService.receive(queueName)
            .then((actualRequest: JsmsMessage) => {
                expect(actualRequest.body).toEqual({request: "PING1"});
                receivedRequests.push(actualRequest.body);
                return {response: "PONG1"};
            })
            .then((actualRequest: JsmsMessage) => {
                expect(actualRequest.body).toEqual({request: "PING2"});
                receivedRequests.push(actualRequest.body);
                return {response: "PONG2"};
            })
            .then((actualRequest: JsmsMessage) => {
                expect(actualRequest.body).toEqual({request: "PING3"});
                receivedRequests.push(actualRequest.body);
                return {response: "PONG3"};
            })
            .then((actualRequest: JsmsMessage) => {
                expect(actualRequest.body).toEqual({request: "PING4"});
                receivedRequests.push(actualRequest.body);
                return {response: "PONG4"};
            })
            .then((actualRequest: JsmsMessage) => {
                expect(actualRequest.body).toEqual({request: "PING5"});
                receivedRequests.push(actualRequest.body);
                return {response: "PONG5"};
            });
        
        messageService.send(queueName, {request: "PING1"})
            .then((actualResponse: JsmsMessage) => {
                expect(actualResponse.body).toEqual({response: "PONG1"});
                receivedResponses.push(actualResponse.body);
                return {request: "PING2"};
            })
            .then((actualResponse: JsmsMessage) => {
                expect(actualResponse.body).toEqual({response: "PONG2"});
                receivedResponses.push(actualResponse.body);
                return {request: "PING3"};
            })
            .then((actualResponse: JsmsMessage) => {
                expect(actualResponse.body).toEqual({response: "PONG3"});
                receivedResponses.push(actualResponse.body);
                return {request: "PING4"};
            })
            .then((actualResponse: JsmsMessage) => {
                expect(actualResponse.body).toEqual({response: "PONG4"});
                receivedResponses.push(actualResponse.body);
                return {request: "PING5"};
            })
            .then((actualResponse: JsmsMessage) => {
                expect(actualResponse.body).toEqual({response: "PONG5"});
                receivedResponses.push(actualResponse.body);
                resolve();
            });
    });

    await promise;

    expect(receivedRequests).toEqual([
        {request: "PING1"},
        {request: "PING2"},
        {request: "PING3"},
        {request: "PING4"},
        {request: "PING5"}
    ]);

    expect(receivedResponses).toEqual([
        {response: "PONG1"},
        {response: "PONG2"},
        {response: "PONG3"},
        {response: "PONG4"},
        {response: "PONG5"}
    ]);

    messageService.close();
});

// --------------------------------------------------------------------------------------------------------------------

