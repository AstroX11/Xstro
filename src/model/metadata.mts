import { DatabaseSync, StatementSync } from "node:sqlite";
import { getDb } from "./database.mjs";
import { GroupMetadata } from "baileys";

function initMetadataDb(): void {
    const db: DatabaseSync = getDb();
    db.exec(`
    CREATE TABLE IF NOT EXISTS group_metadata (
      jid TEXT PRIMARY KEY,
      metadata JSON
    );
  `);
}

export const groupSave = (jid: string, metadata: GroupMetadata): void => {
    const db: DatabaseSync = getDb();
    initMetadataDb();

    const jsonMetadata = JSON.stringify(metadata);
    const stmt: StatementSync = db.prepare(`
    INSERT INTO group_metadata (jid, metadata)
    VALUES (?, ?)
    ON CONFLICT(jid) DO UPDATE SET metadata = excluded.metadata;
  `);

    stmt.run(jid, jsonMetadata);
};

export const groupMetadata = (jid: string): GroupMetadata | undefined => {
    const db: DatabaseSync = getDb();
    initMetadataDb();

    const stmt: StatementSync = db.prepare(`SELECT metadata FROM group_metadata WHERE jid = ?;`);
    const result = stmt.get(jid) as { metadata: string } | undefined;

    return result && result.metadata ? JSON.parse(result.metadata) : undefined;
};
