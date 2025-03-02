import { getDb } from "./database.mjs";
import { StatementSync } from "node:sqlite";

function Antilink(): void {
    const db = getDb();
    db.exec(`CREATE TABLE IF NOT EXISTS antilink (
        id TEXT PRIMARY KEY,
        mode TEXT CHECK(mode IN ('kick', 'delete') OR mode IS NULL),
        status INTEGER NOT NULL DEFAULT 0
    )`);
}

function setAntilink(id: string, status: boolean, mode?: "kick" | "delete"): boolean {
    Antilink();
    const db = getDb();
    const stmt: StatementSync = db.prepare(`INSERT OR REPLACE INTO antilink (id, mode, status) VALUES (?, ?, ?)`);
    stmt.run(id, mode ?? null, status ? 1 : 0);
    return true;
}

function getAntilink(id: string): { mode: "kick" | "delete" | null; status: boolean } | null {
    Antilink();
    const db = getDb();
    const stmt: StatementSync = db.prepare(`SELECT mode, status FROM antilink WHERE id = ?`);
    const result = stmt.get(id) as { mode: "kick" | "delete" | null; status: number } | undefined;
    return result ? { mode: result.mode, status: !!result.status } : null;
}

function delAntilink(id: string): boolean {
    Antilink();
    const db = getDb();
    const stmt: StatementSync = db.prepare(`DELETE FROM antilink WHERE id = ?`);
    const result = stmt.run(id);
    return (result.changes ?? 0) > 0;
}

export { setAntilink, getAntilink, delAntilink };
