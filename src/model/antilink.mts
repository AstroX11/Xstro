import { getDb } from "./database.mjs";
import { Database } from "sqlite";

async function Antilink(): Promise<void> {
    const db: Database = await getDb();
    await db.exec(`CREATE TABLE IF NOT EXISTS antilink (
        id TEXT PRIMARY KEY,
        mode TEXT CHECK(mode IN ('kick', 'delete') OR mode IS NULL),
        status INTEGER NOT NULL DEFAULT 0
    )`);
}

async function setAntilink(id: string, status: boolean, mode?: "kick" | "delete"): Promise<boolean> {
    await Antilink();
    const db: Database = await getDb();
    await db.run(`INSERT OR REPLACE INTO antilink (id, mode, status) VALUES (?, ?, ?)`, [id, mode ?? null, status ? 1 : 0]);
    return true;
}

async function getAntilink(id: string): Promise<{ mode: "kick" | "delete" | null; status: boolean } | null> {
    await Antilink();
    const db: Database = await getDb();
    const result: { mode: "kick" | "delete" | null; status: number } | undefined = await db.get(`SELECT mode, status FROM antilink WHERE id = ?`, [id]);
    return result ? { mode: result.mode, status: !!result.status } : null;
}

async function delAntilink(id: string): Promise<boolean> {
    await Antilink();
    const db: Database = await getDb();
    const result: { changes?: number } = await db.run(`DELETE FROM antilink WHERE id = ?`, [id]);
    return (result.changes ?? 0) > 0;
}

export { setAntilink, getAntilink, delAntilink };
