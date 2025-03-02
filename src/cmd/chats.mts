import { XMessage, Module } from "../index.mjs";

Module({
    name: "pin",
    fromMe: true,
    desc: "Pin a chat",
    type: "chats",
    function: async (message: XMessage) => {
        await message.chatModify({ pin: true }, message.jid);
        return message.send("Pined.");
    },
});

Module({
    name: "unpin",
    fromMe: true,
    desc: "Unpin a chat",
    type: "chats",
    function: async (message: XMessage) => {
        await message.chatModify({ pin: false }, message.jid);
        return message.send("Unpined.");
    },
});

Module({
    name: "archive",
    fromMe: true,
    desc: "Archive a chat",
    type: "chats",
    function: async (message: XMessage) => {
        await message.chatModify({ archive: true, lastMessages: [{ key: message.key, messageTimestamp: message.messageTimestamp }] }, message.jid);
        return message.send("Archived.");
    },
});

Module({
    name: "unarchive",
    fromMe: true,
    desc: "Unarchive a chat",
    type: "chats",
    function: async (message: XMessage) => {
        await message.chatModify({ archive: false, lastMessages: [{ key: message.key, messageTimestamp: message.messageTimestamp }] }, message.jid);
        return message.send("Unarchived.");
    },
});

Module({
    name: "clear",
    fromMe: true,
    desc: "Clear a chat",
    type: "chats",
    function: async (message: XMessage) => {
        await message.chatModify({ delete: true, lastMessages: [{ key: message.key, messageTimestamp: message.messageTimestamp }] }, message.jid);
        return message.send("Cleared.");
    },
});

Module({
    name: "delete",
    fromMe: true,
    desc: "Delete a chat",
    type: "chats",
    function: async (message: XMessage) => {
        return await message.chatModify({ delete: true, lastMessages: [{ key: message.key, messageTimestamp: message.messageTimestamp }] }, message.jid);
    },
});

Module({
    name: "star",
    fromMe: true,
    desc: "Star a message",
    type: "chats",
    function: async (message: XMessage) => {
        if (!message.quoted) {
            return message.send("Reply a message to star");
        }
        const { key } = message.quoted;
        if (!key.id) return;
        await message.chatModify({ star: { messages: [{ id: key.id, fromMe: key.fromMe }], star: true } }, message.jid);
        return message.send("Starred.");
    },
});

Module({
    name: "unstar",
    fromMe: true,
    desc: "Unstar a message",
    type: "chats",
    function: async (message: XMessage) => {
        if (!message.quoted) {
            return message.send("Reply a message to unstar");
        }
        const { key } = message.quoted;
        if (!key.id) return;
        await message.chatModify({ star: { messages: [{ id: key.id, fromMe: key.fromMe }], star: false } }, message.jid);
        return message.send("Unstarred.");
    },
});
