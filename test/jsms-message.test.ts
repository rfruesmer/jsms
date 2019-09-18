import { JsmsMessage } from "../src/jsms-message";
import { JsmsMessageHeader } from "../src/jsms-message-header";


// --------------------------------------------------------------------------------------------------------------------

test("creates default body", () => {
    const message = JsmsMessage.create("/some/destination");
    expect(message.body).toEqual({});
});

// --------------------------------------------------------------------------------------------------------------------

test("creates default response body", () => {
    const message = JsmsMessage.create("/some/destination");
    const responseMessage = JsmsMessage.createResponse(message);
    expect(responseMessage.body).toEqual({});
});

// --------------------------------------------------------------------------------------------------------------------

test("Serializes to string", () => {
    const json = {
        header: {
            id: "some-id",
            destination: "/some/destination",
            expiration: new Date().getTime(),
            correlationID: "some-correlation-id"
        },
        body: {
            bodyProperty: "propertyValue"
        }
    };

    const header = new JsmsMessageHeader(json.header.id, json.header.destination, 
        json.header.expiration, json.header.correlationID);
    const message = new JsmsMessage(header, json.body);
    const serializedMessage = message.toString();
    expect(serializedMessage).toEqual(JSON.stringify(json));
});

// --------------------------------------------------------------------------------------------------------------------

test("deserializes from string", () => {
    const json = {
        header: {
            id: "some-id",
            destination: "/some/destination",
            expiration: new Date().getTime(),
            correlationID: "some-correlation-id"
        },
        body: {
            bodyProperty: "propertyValue"
        }
    };

    const deserializedMessage = JsmsMessage.fromString(JSON.stringify(json));
    expect(deserializedMessage.header).toBeDefined();
    expect(deserializedMessage.header.id).toEqual(json.header.id);
    expect(deserializedMessage.header.destination).toEqual(json.header.destination);
    expect(deserializedMessage.header.correlationID).toEqual(json.header.correlationID);
    expect(deserializedMessage.header.expiration).toEqual(json.header.expiration);
    expect(deserializedMessage.body).toEqual(json.body);
});

// --------------------------------------------------------------------------------------------------------------------
