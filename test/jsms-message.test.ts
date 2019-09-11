import { JsmsMessage } from "@/jsms-message";


// --------------------------------------------------------------------------------------------------------------------

test("creates default body", () => {

    const message = JsmsMessage.create("/some/channel");
    expect(message.body).toEqual({});
});

// --------------------------------------------------------------------------------------------------------------------

