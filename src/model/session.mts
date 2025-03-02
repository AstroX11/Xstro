import { Database } from "sqlite";
import { getDb } from "./database.mjs";

async function initSessionDb(): Promise<void> {
    const db: Database = await getDb();
    await db.exec(`
    CREATE TABLE IF NOT EXISTS session_id (
      id TEXT PRIMARY KEY
    );
  `);
}

export const getSessionId = async (): Promise<string | null> => {
    const db: Database = await getDb();
    await initSessionDb();
    const row = await db.get("SELECT id FROM session_id LIMIT 1");
    return row ? row.id : null;
};

export const setSessionId = async (id: string): Promise<void> => {
    const db: Database = await getDb();
    await initSessionDb();
    await db.run("DELETE FROM session_id");
    await db.run("INSERT INTO session_id (id) VALUES (?)", id);
};
