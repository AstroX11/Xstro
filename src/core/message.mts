import { Client, extractTextFromMessage, getConfig, getDataType, MessageMisc, numToJid } from "../index.mjs";
import { Boom } from "@hapi/boom/lib/index.js";
import { AnyMessageContent, downloadMediaMessage, getContentType, isJidBroadcast, isJidGroup, normalizeMessageContent, WAContextInfo, WAMessage } from "baileys";
import { writeFile } from "fs/promises";

export async function Message(client: Client, messages: WAMessage) {
    const normalizedMessages = {
        ...messages,
        message: normalizeMessageContent(messages.message),
    };
    const { key, message, ...msg } = normalizedMessages;
    const { user, sendMessage } = client;
    const { prefix, mode, sudo } = await getConfig();
    const owner = numToJid(user!.id);
    const sender = isJidGroup(key.remoteJid!) || isJidBroadcast(key.remoteJid!) ? key.participant : key.fromMe ? owner : key.remoteJid;
    const mtype = getContentType(message);
    function hasContextInfo(msg: any): msg is { contextInfo: WAContextInfo } {
        if (!msg || typeof msg !== "object" || msg === null) return false;
        return "contextInfo" in msg && msg.contextInfo !== null && typeof msg.contextInfo === "object";
    }
    const messageContent = message?.[mtype!];
    const Quoted = hasContextInfo(messageContent) ? messageContent.contextInfo : undefined;
    const quotedM = Quoted ? normalizeMessageContent(Quoted!.quotedMessage) : undefined;

    return {
        key,
        message,
        mtype,
        jid: key.remoteJid!,
        isGroup: isJidGroup(key.remoteJid!),
        owner: owner,
        prefix,
        sender: sender,
        text: extractTextFromMessage(message!),
        mentions: Quoted ? Quoted.mentionedJid : [],
        mode,
        sudo: sudo.includes(sender!) || sender === owner,
        user: function (match: string) {
            if (match) return numToJid(match);
            if (Quoted!.participant) Quoted!.participant;
            if (isJidGroup(this.jid) && Quoted?.mentionedJid?.[0]) return Quoted.mentionedJid[0];
            if (!isJidGroup(this.jid) && key!.remoteJid) return key!.remoteJid!;
            return undefined;
        },
        quoted:
            Quoted && quotedM
                ? {
                      key: {
                          remoteJid: key.remoteJid,
                          fromMe: Quoted.participant === owner,
                          id: Quoted.stanzaId,
                          participant: isJidGroup(key.remoteJid!) || isJidBroadcast(key.remoteJid!) ? Quoted.participant : undefined,
                      },
                      message: quotedM,
                      type: getContentType(quotedM),
                      sender: Quoted.participant!,
                      text: extractTextFromMessage(quotedM),
                      broadcast: Boolean(Quoted.remoteJid!),
                      ...(({ quotedMessage, stanzaId, remoteJid, ...rest }) => rest)(Quoted),
                  }
                : undefined,
        isAdmin: async function () {
            const metadata = await this.groupMetadata(this.jid);
            const allAdmins = metadata.participants.filter((v) => v.admin !== null).map((v) => v.id);
            return !Array.isArray(allAdmins) ? Array.from(allAdmins) : allAdmins.includes(sender!);
        },
        isBotAdmin: async function () {
            const metadata = await this.groupMetadata(this.jid);
            const allAdmins = metadata.participants.filter((v) => v.admin !== null).map((v) => v.id);
            return !Array.isArray(allAdmins) ? Array.from(allAdmins) : allAdmins.includes(this.owner);
        },
        send: async function (content: Buffer | string, options: Partial<MessageMisc> = {}) {
            const jid = options.jid ?? this.jid;
            const type = options.type as "text" | "audio" | "image" | "video" | "sticker" | "document" | undefined;
            const atype = await getDataType(content);

            const getMessageContent = async (): Promise<AnyMessageContent> => {
                if (!type) {
                    const { mimeType, contentType } = atype;
                    switch (contentType) {
                        case "text":
                            return { text: content.toString() };
                        case "image":
                            return { image: Buffer.from(content) };
                        case "audio":
                            return { audio: Buffer.from(content) };
                        case "video":
                            return { video: Buffer.from(content) };
                        case "sticker":
                            return { sticker: Buffer.from(content) };
                        case "document":
                            return {
                                document: Buffer.from(content),
                                mimetype: mimeType || "application/octet-stream",
                            };
                        default:
                            throw new Error(`Unsupported auto-detected content type: ${contentType}`);
                    }
                }

                switch (type) {
                    case "text":
                        return { text: content.toString(), ...options };
                    case "image":
                        return { image: Buffer.from(content), ...options };
                    case "audio":
                        return { audio: Buffer.from(content), ptt: options.ptt, ...options };
                    case "video":
                        return {
                            video: Buffer.from(content),
                            ptv: options.ptv,
                            gifPlayback: options.gifPlayback,
                            caption: options.caption,
                            ...options,
                        };
                    case "sticker":
                        return { sticker: Buffer.from(content), ...options };
                    case "document":
                        return {
                            document: Buffer.from(content),
                            mimetype: options.mimetype || atype.mimeType || "application/octet-stream",
                            fileName: options.fileName,
                            caption: options.caption,
                            ...options,
                        };
                    default:
                        throw new Error(`Unsupported explicit type: ${type}`);
                }
            };

            const messageContent = await getMessageContent();
            const m = await sendMessage(jid!, messageContent, { ...options });
            return Message(client, m!);
        },
        edit: async function (text: string) {
            const msg = await client.sendMessage(this.jid, {
                text: text,
                edit: this.quoted ? this.quoted.key : this.key,
            });
            return Message(client, msg!);
        },
        downloadM: async function (message: WAMessage, shouldSaveasFile?: boolean) {
            const media = await downloadMediaMessage(message, "buffer", {});
            if (shouldSaveasFile) {
                return await writeFile(message.key.id!, media);
            }
            return media;
        },
        forward: async function (jid: string, message: WAMessage, opts?: { quoted: WAMessage }) {
            if (!message || !jid) {
                throw new Boom("Illegal there must be a Vaild Web Message and a Jid");
            }
            const m = await sendMessage(jid, { forward: message, ...opts }, { ...opts });
            return Message(client, m!);
        },
        react: async function (emoji: string, message?: WAMessage) {
            const emojiRegex = /\p{Emoji}/u;
            if (!emoji || !emojiRegex.test(emoji)) {
                throw new Boom("Illegal, there must be an emoji");
            }
            const m = await sendMessage(this.jid, { react: { text: emoji, key: message?.key ? this.quoted?.key : this.key } });
            return Message(client, m!);
        },
        delete: async function (message?: WAMessage) {
            const m = await sendMessage(this.jid, { delete: message!.key ? this.quoted!.key : this!.key });
            return Message(client, m!);
        },
        ...msg,
        ...(({ logger, ws, authState, signalRepository, user, ...rest }) => rest)(client),
    };
}

export type XMsg = ReturnType<typeof Message> extends Promise<infer T> ? T : never;
