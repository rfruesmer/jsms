import { JsmsMessage } from "@/jsms-message";
import { JsmsMessageHeader } from "@/jsms-message-header";
import { v4 } from "uuid";

// --------------------------------------------------------------------------------------------------------------------
test("creates default body", () => {

    const message = new JsmsMessage(new JsmsMessageHeader("/some/channel", v4(), 0));
    expect(message.body).toEqual({});
});

// --------------------------------------------------------------------------------------------------------------------

