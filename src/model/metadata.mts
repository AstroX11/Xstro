import { Database } from "sqlite";
import { getDb } from "./database.mjs";
import { GroupMetadata } from "baileys";

async function initMetadataDb(): Promise<void> {
    const db: Database = await getDb();
    await db.exec(`
    CREATE TABLE IF NOT EXISTS group_metadata (
      jid TEXT PRIMARY KEY,
      metadata JSON
    );
  `);
}

export const groupSave = async (jid: string, metadata: GroupMetadata): Promise<void> => {
    const db: Database = await getDb();
    await initMetadataDb();

    const jsonMetadata = JSON.stringify(metadata);
    const query = `
    INSERT INTO group_metadata (jid, metadata)
    VALUES (?, ?)
    ON CONFLICT(jid) DO UPDATE SET metadata = excluded.metadata;
  `;
    await db.run(query, [jid, jsonMetadata]);
};

export const groupMetadata = async (jid: string): Promise<GroupMetadata | undefined> => {
    const db: Database = await getDb();
    await initMetadataDb();

    const query = `SELECT metadata FROM group_metadata WHERE jid = ?;`;
    const result = await db.get(query, [jid]);

    return result && result.metadata ? JSON.parse(result.metadata) : undefined;
};
