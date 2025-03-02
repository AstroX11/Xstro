import { getDb } from "./database.mjs";
import { StatementSync, SupportedValueType } from "node:sqlite";
import { Chat, ChatUpdate, Contact, WAMessage, MessageUpsertType, GroupMetadata, MessageUserReceiptUpdate, GroupParticipant } from "baileys";
import { groupMetadata } from "./metadata.mjs";

export function Store(): void {
    const db = getDb();
    db.exec(`
        CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            lastMessageRecvTimestamp INTEGER,
            data JSON
        )
    `);
    db.exec(`
        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            lid TEXT,
            name TEXT,
            notify TEXT,
            verifiedName TEXT,
            imgUrl TEXT,
            status TEXT
        )
    `);
    db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            remoteJid TEXT,
            id TEXT,
            fromMe INTEGER,
            participant TEXT,
            messageTimestamp INTEGER,
            status TEXT,
            data JSON,
            requestId TEXT,
            upsertType TEXT,
            PRIMARY KEY (remoteJid, id, fromMe)
        )
    `);
    db.exec(`
        CREATE TABLE IF NOT EXISTS message_receipts (
            remoteJid TEXT,
            id TEXT,
            fromMe INTEGER,
            userJid TEXT,
            data JSON,
            PRIMARY KEY (remoteJid, id, fromMe, userJid)
        )
    `);
}

export function chatUpsert(chat: Chat): void {
    const db = getDb();
    const stmt: StatementSync = db.prepare(`
        INSERT OR REPLACE INTO chats (id, lastMessageRecvTimestamp, data)
        VALUES (?, ?, ?)
    `);
    // chat.id is string, lastMessageRecvTimestamp can be number | undefined, data is string
    const params: SupportedValueType[] = [chat.id, chat.lastMessageRecvTimestamp ?? null, JSON.stringify(chat)];
    stmt.run(...params);
}

export function chatUpdate(chatUpdate: ChatUpdate): void {
    const db = getDb();
    const stmt: StatementSync = db.prepare(`
        UPDATE chats 
        SET 
            lastMessageRecvTimestamp = ?,
            data = ?
        WHERE id = ?
    `);
    const params: SupportedValueType[] = [chatUpdate.lastMessageRecvTimestamp ?? null, JSON.stringify(chatUpdate), chatUpdate.id ?? null];
    stmt.run(...params);
}

export function contactUpdate(contactUpdates: Partial<Contact>[]): void {
    const db = getDb();
    const stmt: StatementSync = db.prepare(`
        UPDATE contacts 
        SET 
            lid = COALESCE(?, lid),
            name = COALESCE(?, name),
            notify = COALESCE(?, notify),
            verifiedName = COALESCE(?, verifiedName),
            imgUrl = COALESCE(?, imgUrl),
            status = COALESCE(?, status)
        WHERE id = ?
    `);

    for (const update of contactUpdates) {
        const params: SupportedValueType[] = [
            update.lid ?? null,
            update.name ?? null,
            update.notify ?? null,
            update.verifiedName ?? null,
            update.imgUrl ?? null,
            update.status ?? null,
            update.id ?? null, // id should always be present, but for safety
        ];
        stmt.run(...params);
    }
}

export function contactUpsert(contacts: Contact[]): void {
    const db = getDb();
    const stmt: StatementSync = db.prepare(`
        INSERT OR REPLACE INTO contacts (id, lid, name, notify, verifiedName, imgUrl, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const contact of contacts) {
        const params: SupportedValueType[] = [
            contact.id,
            contact.lid ?? null,
            contact.name ?? null,
            contact.notify ?? null,
            contact.verifiedName ?? null,
            contact.imgUrl ?? null,
            contact.status ?? null,
        ];
        stmt.run(...params);
    }
}

export function upsertM(upsert: { messages: WAMessage[]; type: MessageUpsertType; requestId?: string }): void {
    const db = getDb();
    const stmt: StatementSync = db.prepare(`
        INSERT OR REPLACE INTO messages (
            remoteJid, 
            id, 
            fromMe, 
            participant, 
            messageTimestamp, 
            status, 
            data, 
            requestId, 
            upsertType
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const message of upsert.messages) {
        const timestamp = typeof message.messageTimestamp === "number" ? message.messageTimestamp : Date.now();
        const params: SupportedValueType[] = [
            message.key.remoteJid ?? null,
            message.key.id ?? null,
            message.key.fromMe ? 1 : 0,
            message.participant ?? null,
            timestamp,
            message.status ?? null,
            JSON.stringify(message),
            upsert.requestId ?? null,
            upsert.type,
        ];
        stmt.run(...params);
    }
}

export function Msgreceipt(receipts: MessageUserReceiptUpdate[]): void {
    const db = getDb();
    const stmt: StatementSync = db.prepare(`
        INSERT OR REPLACE INTO message_receipts (remoteJid, id, fromMe, userJid, data)
        VALUES (?, ?, ?, ?, ?)
    `);

    for (const { key, receipt } of receipts) {
        const params: SupportedValueType[] = [key.remoteJid ?? null, key.id ?? null, key.fromMe ? 1 : 0, receipt.userJid ?? null, JSON.stringify(receipt)];
        stmt.run(...params);
    }
}

export function groupUpsert(groups: GroupMetadata[]): void {
    const db = getDb();
    const stmt: StatementSync = db.prepare(`
        INSERT OR REPLACE INTO groups (id, data)
        VALUES (?, ?)
    `);

    for (const group of groups) {
        const params: SupportedValueType[] = [group.id, JSON.stringify(group)];
        stmt.run(...params);
    }
}

export function loadMessage(id: string): any {
    const db = getDb();
    const stmt: StatementSync = db.prepare(`
        SELECT data 
        FROM messages 
        WHERE id = ?
    `);
    const message = stmt.get(id) as { data: string } | undefined;
    return message ? JSON.parse(message.data) : null;
}

export function fetchParticipantsActivity(jid: string, endDate?: number): { pushName: string | null; messageCount: number; participant: string }[] {
    const db = getDb();
    const groupData: GroupMetadata | undefined = groupMetadata(jid);

    if (!groupData || !groupData.participants) {
        return [];
    }

    const participantsMap: Map<string, GroupParticipant> = new Map();
    groupData.participants.forEach((participant) => {
        participantsMap.set(participant.id, participant);
    });

    let query = `
        SELECT data
        FROM messages 
        WHERE remoteJid = ?
    `;
    const params: SupportedValueType[] = [jid];

    if (endDate !== undefined) {
        query += " AND messageTimestamp <= ?";
        params.push(endDate);
    }

    const stmt: StatementSync = db.prepare(query);
    const messages = stmt.all(...params) as { data: string }[];

    const activityMap: Map<string, number> = new Map();
    const pushNameMap: Map<string, string> = new Map();

    messages.forEach((msg) => {
        const messageData = JSON.parse(msg.data);
        const participant: string = messageData.key?.participant || messageData.participant;

        if (participant && participantsMap.has(participant)) {
            activityMap.set(participant, (activityMap.get(participant) || 0) + 1);
            if (messageData.pushName && !pushNameMap.has(participant)) {
                pushNameMap.set(participant, messageData.pushName);
            }
        }
    });

    const results: { pushName: string | null; messageCount: number; participant: string }[] = Array.from(activityMap.entries()).map(([participant, messageCount]) => ({
        pushName: pushNameMap.get(participant) || null,
        messageCount,
        participant,
    }));

    results.sort((a, b) => b.messageCount - a.messageCount);
    return results;
}

export function getChatSummary(jid: string): {
    totalMessages: number;
    lastMessageTimestamp: number | null;
    participantCount: number;
    mostActiveParticipant: string | null;
} {
    const db = getDb();
    const stmtStats: StatementSync = db.prepare(`
        SELECT 
            COUNT(*) AS totalMessages,
            MAX(messageTimestamp) AS lastMessageTimestamp
        FROM messages 
        WHERE remoteJid = ?
    `);
    const chatStats = stmtStats.get(jid) as { totalMessages: number; lastMessageTimestamp: number | null } | undefined;

    const stmtParticipants: StatementSync = db.prepare(`
        SELECT COUNT(DISTINCT participant) AS count
        FROM messages 
        WHERE remoteJid = ?
    `);
    const participantCount = stmtParticipants.get(jid) as { count: number } | undefined;

    const stmtMostActive: StatementSync = db.prepare(`
        SELECT participant
        FROM messages 
        WHERE remoteJid = ?
        GROUP BY participant
        ORDER BY COUNT(*) DESC
        LIMIT 1
    `);
    const mostActive = stmtMostActive.get(jid) as { participant: string } | undefined;

    return {
        totalMessages: chatStats?.totalMessages || 0,
        lastMessageTimestamp: chatStats?.lastMessageTimestamp || null,
        participantCount: participantCount?.count || 0,
        mostActiveParticipant: mostActive?.participant || null,
    };
}

export function getAllMessagesFromChat(jid: string): any[] {
    const db = getDb();
    const stmt: StatementSync = db.prepare(`
        SELECT data 
        FROM messages 
        WHERE remoteJid = ?
        ORDER BY messageTimestamp ASC
    `);
    const messages = stmt.all(jid) as { data: string }[];
    return messages.map((msg) => JSON.parse(msg.data));
}

export function getMessageStatusCount(jid: string): { status: string; count: number }[] {
    const db = getDb();
    const stmt: StatementSync = db.prepare(`
        SELECT 
            status,
            COUNT(*) AS count
        FROM messages 
        WHERE remoteJid = ?
        GROUP BY status
    `);
    const results = stmt.all(jid) as { status: string; count: number }[];
    return results;
}
