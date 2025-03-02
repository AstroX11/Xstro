import { DatabaseSync, StatementSync, SupportedValueType } from "node:sqlite";
import { getSessionId, logger, setSessionId } from "../index.mjs";
import fs from "fs/promises";
import path from "path";

interface SessionData {
    [key: string]: any;
}

export async function SessionMigrator(Sessionfolder: string, SessionDataBasePath: string, SESSION_ID: string): Promise<SessionData | void> {
    try {
        const sId = getSessionId();
        if (!Sessionfolder || !SessionDataBasePath || sId === SESSION_ID) {
            logger.info("No Migration");
            return;
        }

        async function readSessionFiles(): Promise<SessionData> {
            const files = await fs.readdir(Sessionfolder);
            const result: SessionData = {};
            const syncKeyFiles = files.filter((file) => file.startsWith("app-state-sync-key-"));
            await Promise.all(
                syncKeyFiles.map(async (file) => {
                    let dynamicPart = file.substring("app-state-sync-key-".length);
                    if (dynamicPart.endsWith(".json")) dynamicPart = dynamicPart.slice(0, -5);
                    const newKey = `app-state-sync-key:${dynamicPart}`;
                    const content = await fs.readFile(path.join(Sessionfolder, file), "utf8");
                    try {
                        result[newKey] = JSON.parse(content);
                    } catch {
                        result[newKey] = content;
                    }
                })
            );
            if (files.includes("creds.json")) {
                const content = await fs.readFile(path.join(Sessionfolder, "creds.json"), "utf8");
                try {
                    result["creds"] = JSON.parse(content);
                } catch {
                    result["creds"] = content;
                }
            }
            return result;
        }

        const sessionData = await readSessionFiles();
        const db = openDatabase(SessionDataBasePath);
        ensureSessionTable(db);
        if (sessionData.creds) {
            const credsValue = typeof sessionData.creds === "object" ? JSON.stringify(sessionData.creds) : sessionData.creds;
            runQuery(db, "DELETE FROM session WHERE id = ?", ["creds"]);
            const firstRow = getFirstRow(db);
            if (firstRow) {
                runQuery(db, "UPDATE session SET id = ?, data = ? WHERE rowid = ?", ["creds", credsValue, firstRow.rowid]);
            } else {
                runQuery(db, "INSERT INTO session (id, data) VALUES (?, ?)", ["creds", credsValue]);
            }
        }
        for (const key of Object.keys(sessionData)) {
            if (key === "creds") continue;
            const value = typeof sessionData[key] === "object" ? JSON.stringify(sessionData[key]) : sessionData[key];
            runQuery(db, "REPLACE INTO session (id, data) VALUES (?, ?)", [key, value]);
        }
        closeDatabase(db);
        setSessionId(SESSION_ID);
        return sessionData;
    } catch {
        logger.error("No Migration");
        return;
    }
}

function openDatabase(dbPath: string): DatabaseSync {
    return new DatabaseSync(dbPath, { open: true });
}

function runQuery(db: DatabaseSync, sql: string, params: SupportedValueType[] = []): void {
    const stmt: StatementSync = db.prepare(sql);
    stmt.run(...params);
}

function closeDatabase(db: DatabaseSync): void {
    db.close();
}

function ensureSessionTable(db: DatabaseSync): void {
    db.exec("CREATE TABLE IF NOT EXISTS session (id TEXT PRIMARY KEY, data TEXT)");
}

function getFirstRow(db: DatabaseSync): { rowid: number } | undefined {
    const stmt: StatementSync = db.prepare("SELECT rowid FROM session ORDER BY rowid ASC LIMIT 1");
    return stmt.get() as { rowid: number } | undefined;
}
