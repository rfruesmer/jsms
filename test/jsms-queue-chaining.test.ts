import { JsmsDeferred } from "@/jsms-deferred";
import { getLogger, Logger } from "@log4js-node/log4js-api";
import { JsmsMessage } from "@/jsms-message";
import { JsmsService } from "@/jsms-service";

let logger: Logger;

// --------------------------------------------------------------------------------------------------------------------

beforeAll(() => {
    logger = getLogger("jsms");
    logger.level = "debug";
});

// --------------------------------------------------------------------------------------------------------------------
test.skip("message queue supports reply/request chaining of deferreds", async () => {

    const receivedRequests = new Array<object>();
    const receivedResponses = new Array<object>();

    const queueName = "/some/queue";
    const messageService = new JsmsService();

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
