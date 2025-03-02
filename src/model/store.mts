import { Database } from "sqlite";
import { getDb } from "./database.mjs";
import { Chat, ChatUpdate, PresenceData, Contact, WAMessage, MessageUpsertType, GroupMetadata, MessageUserReceiptUpdate, GroupParticipant } from "baileys";
import { groupMetadata } from "./metadata.mjs";

export async function Store(): Promise<void> {
    const db: Database = await getDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            lastMessageRecvTimestamp INTEGER,
            data JSON
        )
    `);
    await db.exec(`
        CREATE TABLE IF NOT EXISTS presences (
            id TEXT,
            participant TEXT,
            lastKnownPresence TEXT,
            lastSeen INTEGER,
            PRIMARY KEY (id, participant)
        )
    `);
    await db.exec(`
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
    await db.exec(`
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
    await db.exec(`
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

export async function chatUpsert(chat: Chat): Promise<void> {
    const db: Database = await getDb();
    await db.run(
        `
        INSERT OR REPLACE INTO chats (id, lastMessageRecvTimestamp, data)
        VALUES (?, ?, ?)
    `,
        [chat.id, chat.lastMessageRecvTimestamp, JSON.stringify(chat)]
    );
}

export async function chatUpdate(chatUpdate: ChatUpdate): Promise<void> {
    const db: Database = await getDb();
    await db.run(
        `
        UPDATE chats 
        SET 
            lastMessageRecvTimestamp = ?,
            data = ?
        WHERE id = ?
    `,
        [chatUpdate.lastMessageRecvTimestamp, JSON.stringify(chatUpdate), chatUpdate.id]
    );
}

export async function updatePresence(presenceUpdate: { id: string; presences: { [participant: string]: PresenceData } }): Promise<void> {
    const db: Database = await getDb();
    const stmt = await db.prepare(`
        INSERT OR REPLACE INTO presences (id, participant, lastKnownPresence, lastSeen)
        VALUES (?, ?, ?, ?)
    `);

    try {
        for (const [participant, presence] of Object.entries(presenceUpdate.presences)) {
            await stmt.run([presenceUpdate.id, participant, presence.lastKnownPresence, presence.lastSeen]);
        }
    } finally {
        await stmt.finalize();
    }
}

export async function contactUpdate(contactUpdates: Partial<Contact>[]): Promise<void> {
    const db: Database = await getDb();
    const stmt = await db.prepare(`
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

    try {
        for (const update of contactUpdates) {
            await stmt.run([update.lid, update.name, update.notify, update.verifiedName, update.imgUrl, update.status, update.id]);
        }
    } finally {
        await stmt.finalize();
    }
}

export async function contactUpsert(contacts: Contact[]): Promise<void> {
    const db: Database = await getDb();
    const stmt = await db.prepare(`
        INSERT OR REPLACE INTO contacts (id, lid, name, notify, verifiedName, imgUrl, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    try {
        for (const contact of contacts) {
            await stmt.run([contact.id, contact.lid, contact.name, contact.notify, contact.verifiedName, contact.imgUrl, contact.status]);
        }
    } finally {
        await stmt.finalize();
    }
}

export async function upsertM(upsert: { messages: WAMessage[]; type: MessageUpsertType; requestId?: string }): Promise<void> {
    const db: Database = await getDb();
    const stmt = await db.prepare(`
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

    try {
        for (const message of upsert.messages) {
            const timestamp = typeof message.messageTimestamp === "number" ? message.messageTimestamp : Date.now();

            await stmt.run([
                message.key.remoteJid,
                message.key.id,
                message.key.fromMe ? 1 : 0,
                message.participant || undefined,
                timestamp,
                message.status || undefined,
                JSON.stringify(message),
                upsert.requestId || undefined,
                upsert.type,
            ]);
        }
    } finally {
        await stmt.finalize();
    }
}

export async function Msgreceipt(receipts: MessageUserReceiptUpdate[]): Promise<void> {
    const db: Database = await getDb();
    const stmt = await db.prepare(`
        INSERT OR REPLACE INTO message_receipts (remoteJid, id, fromMe, userJid, data)
        VALUES (?, ?, ?, ?, ?)
    `);

    try {
        for (const { key, receipt } of receipts) {
            await stmt.run([key.remoteJid, key.id, key.fromMe ? 1 : 0, receipt.userJid, JSON.stringify(receipt)]);
        }
    } finally {
        await stmt.finalize();
    }
}

export async function groupUpsert(groups: GroupMetadata[]): Promise<void> {
    const db: Database = await getDb();
    const stmt = await db.prepare(`
        INSERT OR REPLACE INTO groups (id, data)
        VALUES (?, ?)
    `);

    try {
        for (const group of groups) {
            await stmt.run([group.id, JSON.stringify(group)]);
        }
    } finally {
        await stmt.finalize();
    }
}

export async function loadMessage(id: string): Promise<any> {
    const db: Database = await getDb();
    const message = await db.get(
        `
        SELECT data 
        FROM messages 
        WHERE id = ?
        `,
        [id]
    );
    return message ? JSON.parse(message.data) : null;
}

export async function fetchParticipantsActivity(jid: string, endDate?: number): Promise<{ pushName: string | null; messageCount: number; participant: string }[]> {
    const db: Database = await getDb();
    const groupData: GroupMetadata | undefined = await groupMetadata(jid);

    if (!groupData || !groupData.participants) {
        return [];
    }

    const participantsMap: Map<string, GroupParticipant> = new Map();
    groupData.participants.forEach((participant) => {
        participantsMap.set(participant.id, participant);
    });

    let query: string = `
        SELECT data
        FROM messages 
        WHERE remoteJid = ?
    `;
    const params: (string | number)[] = [jid];

    if (endDate !== undefined) {
        query += " AND messageTimestamp <= ?";
        params.push(endDate);
    }

    const messages = await db.all(query, params);
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

export async function getChatSummary(jid: string): Promise<{
    totalMessages: number;
    lastMessageTimestamp: number | null;
    participantCount: number;
    mostActiveParticipant: string | null;
}> {
    const db: Database = await getDb();
    const chatStats = await db.get(
        `
        SELECT 
            COUNT(*) AS totalMessages,
            MAX(messageTimestamp) AS lastMessageTimestamp
        FROM messages 
        WHERE remoteJid = ?
        `,
        [jid]
    );
    const participantCount = await db.get(
        `
        SELECT COUNT(DISTINCT participant) AS count
        FROM messages 
        WHERE remoteJid = ?
        `,
        [jid]
    );
    const mostActive = await db.get(
        `
        SELECT participant
        FROM messages 
        WHERE remoteJid = ?
        GROUP BY participant
        ORDER BY COUNT(*) DESC
        LIMIT 1
        `,
        [jid]
    );

    return {
        totalMessages: chatStats?.totalMessages || 0,
        lastMessageTimestamp: chatStats?.lastMessageTimestamp || null,
        participantCount: participantCount?.count || 0,
        mostActiveParticipant: mostActive?.participant || null,
    };
}

export async function getAllMessagesFromChat(jid: string): Promise<any[]> {
    const db: Database = await getDb();
    const messages = await db.all(
        `
        SELECT data 
        FROM messages 
        WHERE remoteJid = ?
        ORDER BY messageTimestamp ASC
        `,
        [jid]
    );
    return messages.map((msg) => JSON.parse(msg.data));
}

export async function getMessageStatusCount(jid: string): Promise<
    {
        status: string;
        count: number;
    }[]
> {
    const db: Database = await getDb();
    const results = await db.all(
        `
        SELECT 
            status,
            COUNT(*) AS count
        FROM messages 
        WHERE remoteJid = ?
        GROUP BY status
        `,
        [jid]
    );
    return results;
}
