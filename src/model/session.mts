import { getDb } from "./database.mjs";
import { StatementSync } from "node:sqlite";

function initSessionDb(): void {
    const db = getDb();
    db.exec(`
        CREATE TABLE IF NOT EXISTS session_id (
            id TEXT PRIMARY KEY
        )
    `);
}

export const getSessionId = (): string | null => {
    const db = getDb();
    initSessionDb();
    const stmt: StatementSync = db.prepare("SELECT id FROM session_id LIMIT 1");
    const row = stmt.get() as { id: string } | undefined;
    return row ? row.id : null;
};

export const setSessionId = (id: string): void => {
    const db = getDb();
    initSessionDb();
    const stmtDelete: StatementSync = db.prepare("DELETE FROM session_id");
    stmtDelete.run();
    const stmtInsert: StatementSync = db.prepare("INSERT INTO session_id (id) VALUES (?)");
    stmtInsert.run(id);
};
