import { JsmsMessage } from "@/jsms-message";


// --------------------------------------------------------------------------------------------------------------------

test("creates default body", () => {
    const message = JsmsMessage.create("/some/channel");
    expect(message.body).toEqual({});
});

// --------------------------------------------------------------------------------------------------------------------

test("creates default response body", () => {
    const message = JsmsMessage.create("/some/channel");
    const responseMessage = JsmsMessage.createResponse(message);
    expect(responseMessage.body).toEqual({});
});

// --------------------------------------------------------------------------------------------------------------------
