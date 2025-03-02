import util from "util";
import { isUrl } from "./constants.mjs";
import { XMsg } from "./core/index.mjs";
import { getAntiword, getAntilink } from "./model/index.mjs";

export async function upsertsM(message: XMsg) {
    Promise.all([evaluator(message), Antilink(message), Antiword(message)]);
}

async function evaluator(message: XMsg) {
    if (!message.text) return;

    if (message.text.startsWith("$ ")) {
        try {
            const code = message.text.slice(2);
            const result = await eval(`(async () => { ${code} })()`);
            await message.send(util.inspect(result, { depth: 1 }));
        } catch (error) {
            await message.send("Error: " + (error instanceof Error ? error.message : String(error)));
        }
    }
}

async function Antilink(message: XMsg) {
    if (!message.isGroup || !message.text || message.sudo || (await message.isAdmin())) return;
    const settings = await getAntilink(message.jid);
    if (!settings?.status) return;
    if (!isUrl(message.text)) return;

    if (settings.mode === "kick") {
        if (!(await message.isBotAdmin())) return;
        await message.sendMessage(message.jid, { delete: message.key });
        await message.groupParticipantsUpdate(message.jid, [message.sender!], "remove");
        await message.sendMessage(message.jid, { text: `@${message.sender!.split("@")[0]} has been kicked for sending links!`, mentions: [message.sender!] });
    }

    if (settings.mode === "delete") {
        if (!(await message.isBotAdmin())) return;
        await message.sendMessage(message.jid, { delete: message.key });
        await message.sendMessage(message.jid, { text: `@${message.sender!.split("@")[0]} links are not allowed here!`, mentions: [message.sender!] });
    }
}

async function Antiword(message: XMsg) {
    if (!message.isGroup || !message.text || message.sudo || (await message.isAdmin())) return;
    const settings = await getAntiword(message.jid);
    if (!settings?.status) return;

    if (message.text) message.text = message.text.toLowerCase();
    if (
        settings.words.some((word) => {
            // Only match complete words with word boundaries
            const pattern = new RegExp(`\\b${word}\\b`, "i");
            return pattern.test(message.text || "");
        })
    ) {
        await message.sendMessage(message.jid, { delete: message.key });
        await message.sendMessage(message.jid, { text: `@${message.sender!.split("@")[0]} those words are not allowed here!`, mentions: [message.sender!] });
    }
}

export async function Chatbot(message: XMsg) {
    if (!message.text) return;
    if (!message.mentions?.includes(message.owner) && message.quoted?.sender !== message.owner) return;
}
