import { JsmsDeferred } from "@/jsms-deferred";
import { getLogger, Logger } from "@log4js-node/log4js-api";

let logger: Logger;

// --------------------------------------------------------------------------------------------------------------------

beforeAll(() => {
    logger = getLogger("jsms");
    logger.level = "debug";
});

// --------------------------------------------------------------------------------------------------------------------

test("can be resolved", async () => {
    const deferred = new JsmsDeferred<string>();
    deferred.resolve("test");
    await expect(deferred.promise).resolves.toEqual("test");
});

// --------------------------------------------------------------------------------------------------------------------

test("can be rejected", async () => {
    const expectedError = new Error("fail");
    const deferred = new JsmsDeferred<string>();
    deferred.reject(expectedError);
    await expect(deferred.promise).rejects.toThrowError(expectedError);
});

// --------------------------------------------------------------------------------------------------------------------

test("supports simple then callback", async () => {
    let actualResolvedValue = "";
    const expectedResolvedValue = "test";

    const deferred = new JsmsDeferred<string>();
    deferred.then((value: string) => {
        actualResolvedValue = value;
    });

    deferred.resolve(expectedResolvedValue);
    await deferred.promise;

    expect(actualResolvedValue).toEqual(expectedResolvedValue);
});

// --------------------------------------------------------------------------------------------------------------------

test("is resolved after catching an error", async () => {
    const deferred = new JsmsDeferred<string>();
    deferred.then((value: string) => {
        throw new Error("fail");
    });

    deferred.resolve("test");
    await expect(deferred.promise).resolves.toEqual("test");
});

// --------------------------------------------------------------------------------------------------------------------

test("supports chaining thens", async () => {
    let result = "";

    const promise = new Promise<string>((done) => {
        const d1 = new JsmsDeferred<string>();
        d1.then((value: string) => {
            return "r1";
        })
        .then((value: string) => {
            result = value;
            done(value);
        });

        d1.resolve("v1");
    });

    
    await promise;
    expect(result).toEqual("r1");
});

// --------------------------------------------------------------------------------------------------------------------

test("supports chaining resolves", async () => {
    let result = "";

    const d1 = new JsmsDeferred<string>();
    d1.then((value: string) => {
        return "r1";
    });

    const promise = new Promise<string>((done) => {
        d1.resolve("v1").then((value: string) => {
            result = value;
            done(value);
        });
    });
    
    await promise;
    expect(result).toEqual("r1");
});

// --------------------------------------------------------------------------------------------------------------------

