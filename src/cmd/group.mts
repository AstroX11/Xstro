import { XMsg, Module, numToJid } from "../index.mjs";

Module({
    name: "newgc",
    fromMe: true,
    isGroup: false,
    desc: "Add a user to a Group",
    type: "group",
    function: async (message: XMsg, match: string) => {
        if (!match) {
            return message.send(`Usage: ${message.prefix}newgc MyGroup|1244556`);
        }
        const [groupName, numbers] = match.split("|");

        if (!groupName || !numbers) {
            return message.send("Usage: GroupName|Number1,Number2");
        }
        const participants = numbers.split(",").map((num) => numToJid(num.trim()));
        await message.groupCreate(groupName.trim(), message.mentions && message.mentions.length > 0 ? message.mentions : participants);
    },
});

Module({
    name: "kick",
    fromMe: false,
    isGroup: true,
    desc: "Remove a participant from Group",
    type: "group",
    function: async (message: XMsg, match: string) => {
        if (!(await message.isAdmin())) {
            return message.send("You are not Admin.");
        }
        if (!(await message.isBotAdmin())) {
            return message.send("I am not an Admin.");
        }
        if (!match) {
            return message.send("Provide a participant to kick.");
        }
        const user = message.user(match);
        if (!user) {
            return message.send("Provide a participant to kick.");
        }
        await message.groupParticipantsUpdate(message.jid, [user], "remove");
    },
});

Module({
    name: "gname",
    fromMe: false,
    isGroup: true,
    desc: "Update Group Name",
    type: "group",
    function: async (message: XMsg, match: string) => {
        if (!match) {
            return message.send("Provide A New Group Name");
        }
        if (!(await message.isAdmin())) {
            return message.send("You are not Admin");
        }
        if (!(await message.isBotAdmin())) {
            return message.send("I am not Admin");
        }
        await message.groupUpdateSubject(message.jid, match);
        return message.send("Group Name Update");
    },
});

Module({
    name: "gdesc",
    fromMe: false,
    isGroup: true,
    desc: "Update Group Description",
    type: "group",
    function: async (message: XMsg, match?: string) => {
        if (!(await message.isAdmin())) {
            return message.send("You are not Admin");
        }
        if (!(await message.isBotAdmin())) {
            return message.send("I am not Admin");
        }
        await message.groupUpdateDescription(message.jid, match);
        return message.send("Group Description Updated");
    },
});
