import { JsmsMessage } from "@/jsms-message";
import { JsmsService } from "@/jsms-service";
import { FakeConnection } from "./fake-connection";
import { FakeCustomMessage } from "./fake-custom-message";
import { FakeTopicPublisher } from "./fake-topic-publisher";
import { JsTopicSubscriber } from "@/js-topic-subscriber";


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

test("topic subscription is open for extension via custom topic subscriber", async () => {
    const topicName = "/some/topic";
    const expectedMessageBody = { test: "foo" };

    // given custom message consumer for a given topic name
    const connection = new FakeConnection();
    const topic = messageService.createTopic(topicName, connection);
    const customTopicSubscriber = connection.getConsumer(topic) as JsTopicSubscriber;
    const promise = customTopicSubscriber.receive().promise;

    // when receiving a custom message
    connection.onCustomMessageReceived(new FakeCustomMessage(topicName, expectedMessageBody));

    // then the message should be published to the custom message consumer
    const actualMessage = await promise;
    expect(actualMessage.body).toEqual(expectedMessageBody);

    topic.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("errors thrown by custom topic subscribers are caught by JsMessageConsumer", async () => {
    const topicName = "/some/topic";
    const expectedMessageBody = { test: "foo" };

    // given custom message consumer for a given topic name
    const connection = new FakeConnection();
    const topic = messageService.createTopic(topicName, connection);
    const customTopicSubscriber = connection.getConsumer(topic) as JsTopicSubscriber;
    customTopicSubscriber.receive().then((message: JsmsMessage) => {
        throw new Error("which should be caught");
    });

    // when receiving a custom message
    const result = connection.onCustomMessageReceived(new FakeCustomMessage(topicName, expectedMessageBody));

    // then the dispatch should have caught the exception and returned false
    expect(result).toBeFalsy();

    topic.close();
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

    topic.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("message service integrates with custom topic publisher", async () => {
    const topicName = "/some/topic";
    const expectedMessageBody = { test: "foo" };

    // given custom message producer for a given topic name
    const connection = new FakeConnection();
    const topic = messageService.createTopic(topicName, connection);
    const customTopicPublisher = connection.getProducer(topic) as FakeTopicPublisher;
    expect(customTopicPublisher.getLastMessage()).toBeUndefined();

    // when publishing a message to topic
    messageService.publish(topicName, expectedMessageBody);

    // then the custom message producer should have received the message
    const lastMessage = customTopicPublisher.getLastMessage();
    expect(lastMessage).toBeDefined();
    expect(lastMessage.body).toEqual(expectedMessageBody);

    topic.close();
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

test("errors thrown by topic subsciber listeners are caught", async () => {
    const topicName = "/some/topic";
    const expectedMessageBody = {};

    const executionOfTopicListener = () => {
        messageService.subscribe(topicName, (message: JsmsMessage) => { 
            throw new Error("which should be caught");
        });
        messageService.publish(topicName);
    };

    expect(executionOfTopicListener).not.toThrow();
});

// --------------------------------------------------------------------------------------------------------------------

test("a topic listener can be unsubscribed", async () => {
    const topicName = "/some/topic";
    const expectedMessageBody = { test: "foo" };
    let subsciberOneWasCalled = false;
    let subsciberTwoWasCalled = false;
    let subsciberThreeWasCalled = false;

    const subscriberOne = (message: JsmsMessage) => { 
        subsciberOneWasCalled = true;
    };

    const subscriberTwo = (message: JsmsMessage) => { 
        subsciberTwoWasCalled = true;
    };

    const subscriberThree = (message: JsmsMessage) => { 
        subsciberThreeWasCalled = true;
    };

    messageService.subscribe(topicName, subscriberOne);
    messageService.subscribe(topicName, subscriberTwo);
    messageService.subscribe(topicName, subscriberThree);

    messageService.unsubscribe(topicName, subscriberTwo);

    messageService.publish(topicName, expectedMessageBody);

    expect(subsciberOneWasCalled).toBeTruthy();
    expect(subsciberTwoWasCalled).toBeFalsy();
    expect(subsciberThreeWasCalled).toBeTruthy();
});

// --------------------------------------------------------------------------------------------------------------------

test("unsubscribing doesn't have any side effect if the listener isn't registered", async () => {
    const topicName = "/some/topic";
    const expectedMessageBody = { test: "foo" };
    let subsciberOneWasCalled = false;
    let subsciberTwoWasCalled = false;
    let subsciberThreeWasCalled = false;

    const subscriberOne = (message: JsmsMessage) => { 
        subsciberOneWasCalled = true;
    };

    const subscriberTwo = (message: JsmsMessage) => { 
        subsciberTwoWasCalled = true;
    };

    const subscriberThree = (message: JsmsMessage) => { 
        subsciberThreeWasCalled = true;
    };

    messageService.subscribe(topicName, subscriberOne);
    messageService.subscribe(topicName, subscriberThree);
    messageService.unsubscribe(topicName, subscriberTwo);

    messageService.publish(topicName, expectedMessageBody);

    expect(subsciberOneWasCalled).toBeTruthy();
    expect(subsciberTwoWasCalled).toBeFalsy();
    expect(subsciberThreeWasCalled).toBeTruthy();
});

// --------------------------------------------------------------------------------------------------------------------

test("unsubscribing doesn't have any side effect if the topic doesn't exist", async () => {
    const topicName = "/some/topic";
    const expectedMessageBody = { test: "foo" };
    let subsciberOneWasCalled = false;
    let subsciberTwoWasCalled = false;
    let subsciberThreeWasCalled = false;

    const subscriberOne = (message: JsmsMessage) => { 
        subsciberOneWasCalled = true;
    };

    const subscriberTwo = (message: JsmsMessage) => { 
        subsciberTwoWasCalled = true;
    };

    const subscriberThree = (message: JsmsMessage) => { 
        subsciberThreeWasCalled = true;
    };

    messageService.subscribe(topicName, subscriberOne);
    messageService.subscribe(topicName, subscriberTwo);
    messageService.subscribe(topicName, subscriberThree);
    
    expect(() => {
        messageService.unsubscribe("/non-existing/topic", subscriberTwo);
    }).not.toThrow();

    messageService.publish(topicName, expectedMessageBody);

    expect(subsciberOneWasCalled).toBeTruthy();
    expect(subsciberTwoWasCalled).toBeTruthy();
    expect(subsciberThreeWasCalled).toBeTruthy();
});

// --------------------------------------------------------------------------------------------------------------------
