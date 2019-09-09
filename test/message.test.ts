import { Message } from "@/message";
import { MessageHeader } from "@/message-header";
import { v4 } from "uuid";

// --------------------------------------------------------------------------------------------------------------------
test("creates default body", () => {

    const message = new Message(new MessageHeader("/some/channel", v4(), 0));
    expect(message.body).toEqual({});
});

// --------------------------------------------------------------------------------------------------------------------

