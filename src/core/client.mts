// Main
import { Boom } from "@hapi/boom";
import { makeWASocket, makeCacheableSignalKeyStore, DisconnectReason, Browsers, BufferJSON, WASocket } from "baileys";
import { EventEmitter } from "events";
import * as P from "pino";

// Local
import * as CacheStore from "./store.mjs";
import { useSQLiteAuthState } from "./use-sqlite-authstate.mjs";
import { XMsg } from "./message.mjs";
import { Store, chatUpdate, contactUpdate, Msgreceipt, chatUpsert, contactUpsert, groupUpsert, upsertM, groupMetadata, groupSave } from "../model/index.mjs";
import { runCommand } from "./plugins.mjs";
import { upsertsM } from "../upserts.mjs";

EventEmitter.defaultMaxListeners = 10000;
process.setMaxListeners(10000);

export const logger = P.pino({
    level: process.env.DEBUG ? "info" : "silent",
});

export const client = async (database?: string): Promise<WASocket> => {
    const { state, saveCreds } = await useSQLiteAuthState(database ? database : "database.db");
    const cache = new CacheStore.default();
    await Store();

    const conn = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger, cache),
        },
        printQRInTerminal: true,
        logger,
        browser: Browsers.macOS("Desktop"),
        emitOwnEvents: true,
        cachedGroupMetadata: async (jid) => await groupMetadata(jid),
    });

    conn.ev.process(async (events) => {
        if (events["connection.update"]) {
            const { connection, lastDisconnect } = events["connection.update"];
            if (connection === "connecting") console.log("connecting...");
            else if (connection === "close") (lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.loggedOut ? process.exit(1) : client(database);
            else if (connection === "open") {
                await conn.sendMessage(conn?.user?.id!, { text: "Bot is online now!" });
                console.log(`Connected!`);
            }
        }

        if (events["creds.update"]) await saveCreds();

        if (events["messages.upsert"]) {
            const { messages, type, requestId } = events["messages.upsert"];
            await upsertM({ messages, type, requestId });
            if (type === "notify") {
                for (const message of messages) {
                    if (message?.messageStubParameters && message?.messageStubParameters!?.[0] === "Message absent from node") {
                        await conn.sendMessageAck(JSON.parse(JSON.stringify(message?.messageStubParameters!?.[1], BufferJSON.reviver)));
                    }
                    const msg = await XMsg(conn, message!);
                    Promise.all([runCommand(msg), upsertsM(msg)]);
                }
            }
        }
        if (events["chats.upsert"]) {
            const chatUpserts = events["chats.upsert"];
            if (chatUpserts) {
                for (const chat of chatUpserts) {
                    await chatUpsert(chat);
                }
            }
        }
        if (events["chats.update"]) {
            const chatUpserts = events["chats.update"];
            if (chatUpserts) {
                for (const updates of chatUpserts) {
                    await chatUpdate(updates);
                }
            }
        }
        if (events["groups.upsert"]) {
            const groupUpdates = events["groups.upsert"];
            if (groupUpdates) {
                await groupUpsert(groupUpdates);
            }
        }
        if (events["message-receipt.update"]) {
            const receipts = events["message-receipt.update"];
            if (receipts) {
                await Msgreceipt(receipts);
            }
        }
        if (events["contacts.update"]) {
            const contactUpdates = events["contacts.update"];
            if (contactUpdates) {
                await contactUpdate(contactUpdates);
            }
        }
        if (events["contacts.upsert"]) {
            const contact = events["contacts.upsert"];
            if (contact) {
                await contactUpsert(contact);
            }
        }
    });

    setInterval(async () => {
        try {
            if (!conn.authState?.creds?.registered) return;
            const groups = await conn.groupFetchAllParticipating();
            for (const [id, metadata] of Object.entries(groups)) {
                await groupSave(id, metadata);
            }
        } catch (error) {
            throw new Boom(error.message as Error);
        }
    }, 300 * 1000);

    return conn;
};
