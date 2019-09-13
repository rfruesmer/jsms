import { JsmsDeferred } from "@/jsms-deferred";
import { getLogger, Logger } from "@log4js-node/log4js-api";

let logger: Logger;

// --------------------------------------------------------------------------------------------------------------------

beforeAll(() => {
    logger = getLogger("jsms");
    logger.level = "debug";
});

// --------------------------------------------------------------------------------------------------------------------

test("a deferred can be resolved", (done) => {
    const deferred = new JsmsDeferred<string>();
    deferred.then((value: string) => {
        expect(value).toEqual("PING");
        done();
    });

    deferred.resolve("PING");
});

// --------------------------------------------------------------------------------------------------------------------

test("a deferred can return a value", async () => {
    const deferred = new JsmsDeferred<string>();
    deferred.then((value: string) => {
        expect(value).toEqual("PING");
        return "PONG";
    });

    deferred.resolve("PING");

    await deferred.promise;

    expect(deferred.thenResult).toEqual("PONG");
});

// --------------------------------------------------------------------------------------------------------------------
