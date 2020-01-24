import { getLogger } from "@log4js-node/log4js-api";
import { JsmsService } from "../../src/jsms-service";
import { ChromiumConnection } from "../../src/extensions/chromium-connection";
import { JsmsMessage } from "../../src/jsms-message";

let messageService: JsmsService;
const queueName = "/some/destination";
const defaultTimeToLive = 60000;
const expectedRequestBody = {request: "PING"};
const expectedResponseBody = {response: "PONG"};


class FakeWindowWithSimpleChromiumResponder {
    public cefQuery(query: any): void {
        const actualRequest = JSON.parse(query.request);
        expect(actualRequest.body).toEqual(expectedRequestBody);

        setTimeout(() => {
            const response = JsmsMessage.createResponse(actualRequest, expectedResponseBody, defaultTimeToLive);
            this.onMessage(response);
        }, 500);
    }

    // This will be overwritten by our Chromium connection
    private onMessage(message: JsmsMessage): void {
        throw new Error("Illegal call");
    }
}

// --------------------------------------------------------------------------------------------------------------------

beforeAll(() => {
    getLogger("jsms").level = "debug";
});

// --------------------------------------------------------------------------------------------------------------------

beforeEach(() => {
    messageService = new JsmsService();
});

// --------------------------------------------------------------------------------------------------------------------

afterEach(() => {
    messageService.close();
});

// --------------------------------------------------------------------------------------------------------------------

test("ChromiumConnection supports simple asynchronous request/reply chaining with deferreds", async () => {

    const globalNS = new FakeWindowWithSimpleChromiumResponder();
    const connection = new ChromiumConnection(globalNS);

    messageService.createQueue(queueName, connection);

    const promise = new Promise<void>((resolve) => {
        messageService.send(queueName, expectedRequestBody)
            .then(actualResponse => {
                expect(actualResponse.body).toEqual(expectedResponseBody);
                resolve();
            });
    });

    await promise;
});

// --------------------------------------------------------------------------------------------------------------------

test("ChromiumConnection supports delayed client handshake", async () => {

    const globalNS = new FakeWindowWithSimpleChromiumResponder();
    const connection = new ChromiumConnection(globalNS);

    messageService.createQueue(queueName, connection);

    // const promise = new Promise<void>((resolve) => {
    //     messageService.send(queueName, expectedRequestBody)
    //         .then(actualResponse => {
    //             expect(actualResponse.body).toEqual(expectedResponseBody);
    //             resolve();
    //         });
    // });

    const handshakeDeferred = connection.sendReady();

    await expect(handshakeDeferred.promise).resolves.toBeDefined();
});

// --------------------------------------------------------------------------------------------------------------------
