import { delAntilink, getAntilink, getAntiword, XMessage, Module, setAntilink, setAntiword } from "../index.mjs";

Module({
    name: "antilink",
    fromMe: false,
    isGroup: true,
    desc: "Manage and Setup Antilink",
    type: "group",
    function: async (message: XMessage, match?: string) => {
        const prefix = message.prefix;
        if (!match) {
            return message.send(`Usage:\n${prefix}antilink on\n${prefix}antilink off\n${prefix}antilink set kick\n${prefix}antilink set delete`);
        }
        const cmd = match.split(" ");
        const mode = cmd[0].toLowerCase();
        if (mode === "on") {
            if ((await getAntilink(message.jid))?.status) return message.send("Antilink is already enabled");
            await setAntilink(message.jid, true, "delete");
            return message.send("Antilink is now enabled");
        }
        if (mode === "off") {
            if (!(await getAntilink(message.jid))?.status) return message.send("Antilink is already disabled");
            await delAntilink(message.jid);
            return message.send("Antilink is now disabled");
        }
        if (mode === "set") {
            if (!(await getAntilink(message.jid))) return message.send(`Antilink must be enabled first, use ${prefix}antilink on`);
            if (cmd[1] === "kick") {
                await setAntilink(message.jid, true, "kick");
                return message.send("Antilink mode is now set to kick");
            }
            if (cmd[1] === "delete") {
                await setAntilink(message.jid, true, "delete");
                return message.send("Antilink mode is now set to delete");
            }
        }
    },
});

Module({
    name: "antiword",
    fromMe: false,
    isGroup: true,
    desc: "Manage and Setup Antiword",
    type: "group",
    function: async (message: XMessage, match?: string) => {
        const prefix = message.prefix;
        if (!match) {
            return message.send(`Usage:\n${prefix}antiword on\n${prefix}antiword off\n${prefix}antiword set badword1, badword2, badword3`);
        }
        const cmd = match.split(" ");
        const mode = cmd[0].toLowerCase();
        if (mode === "on") {
            if ((await getAntiword(message.jid))?.status) return message.send("Antiword is already enabled");
            await setAntiword(message.jid, 1, ["nobadwordshereuntiluserputsone"]);
            return message.send("Antiword is now enabled");
        }
        if (mode === "off") {
            if (!(await getAntiword(message.jid))?.status) return message.send("Antiword is already disabled");
            await delAntilink(message.jid);
            return message.send("Antiword is now disabled");
        }
        if (mode === "set") {
            if (!(await getAntiword(message.jid))?.status) return message.send(`Antiword must be enabled first, use ${prefix}antiword on`);
            if (!cmd[1]) return message.send(`Usage:\n${prefix}antiword set badword1, badword2, badword3`);
            const m = await setAntiword(message.jid, 1, cmd[1].split(","));
            return message.send(`Added ${m.added} badwords to list.`);
        }
    },
});
