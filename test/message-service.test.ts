import { Message } from "@/message";
import { MessageHeader } from "@/message-header";
import { MessageService } from "@/message-service";


let messageService: MessageService;

beforeEach(() => {
    messageService = new MessageService();
});
  
// --------------------------------------------------------------------------------------------------------------------

test("a queue delivers a message immediately when the receiver is already registered", done => {
    const queueName = "/some/queue";
    const expectedMessageBody = {test: "foo"};

    messageService.receive(queueName, (actualMessage: Message) => {
        expect(actualMessage.body).toEqual(expectedMessageBody);
        done();
        return {};
    });
    
    messageService.send(queueName, expectedMessageBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a receiver can fetch a pending message after registration", done => {
    const queueName = "/some/queue";
    const expectedMessageBody = {test: "foo"};

    messageService.send(queueName, expectedMessageBody);

    messageService.receive(queueName, (actualMessage: Message) => {
        expect(actualMessage.body).toEqual(expectedMessageBody);
        done();
        return {};
    });
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue delivers pending messages in the order they were sent", done => {
    const queueName = "/some/queue";
    const firstExpectedMessageBody = {test: "1"};
    const secondExpectedMessageBody = {test: "2"};
    const thirdExpectedMessageBody = {test: "3"};

    messageService.send(queueName, firstExpectedMessageBody);
    messageService.send(queueName, secondExpectedMessageBody);
    messageService.send(queueName, thirdExpectedMessageBody);

    let messageCount = 0;

    messageService.receive(queueName, (actualMessage: Message) => {
        messageCount++;

        switch (messageCount) {
        case 1:
            expect(actualMessage.body).toEqual(firstExpectedMessageBody);
            break;

        case 2:
            expect(actualMessage.body).toEqual(secondExpectedMessageBody);
            break;

        case 3:
            expect(actualMessage.body).toEqual(thirdExpectedMessageBody);
            done();
            break;
        }

        return {};
    });
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver can send a response when the message is sent after registration of the receiver", async () => {
    const queueName = "/some/queue";
    const messageBody = {test: "foo"};
    const expectedResponseBody = {response: "payload"};

    messageService.receive(queueName, (actualMessage: Message) => {
        return expectedResponseBody;
    });

    const response = await messageService.send(queueName, messageBody);
    expect(response.body).toEqual(expectedResponseBody);
});

// --------------------------------------------------------------------------------------------------------------------

test("a queue receiver can send a response when the message is sent before registration of the receiver", async () => {
    const queueName = "/some/queue";
    const messageBody = {test: "foo"};
    const expectedResponseBody = {response: "payload"};

    const promise = messageService.send(queueName, messageBody);

    messageService.receive(queueName, (actualMessage: Message) => {
        return expectedResponseBody;
    });

    const response = await promise;
    expect(response.body).toEqual(expectedResponseBody);
});

// --------------------------------------------------------------------------------------------------------------------