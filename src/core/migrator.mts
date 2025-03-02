import sqlite3 from "sqlite3";
import { getSessionId, logger, setSessionId } from "../index.mjs";
import fs from "fs/promises";
import path from "path";

interface SessionData {
    [key: string]: any;
}

export async function SessionMigrator(Sessionfolder: string, SessionDataBasePath: string, SESSION_ID: string): Promise<SessionData | void> {
    try {
        const sId = await getSessionId();
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
        const db = await openDatabase(SessionDataBasePath);
        await ensureSessionTable(db);
        if (sessionData.creds) {
            const credsValue = typeof sessionData.creds === "object" ? JSON.stringify(sessionData.creds) : sessionData.creds;
            await runQuery(db, "DELETE FROM session WHERE id = ?", ["creds"]);
            const firstRow = await getFirstRow(db);
            if (firstRow) {
                await runQuery(db, "UPDATE session SET id = ?, data = ? WHERE rowid = ?", ["creds", credsValue, firstRow.rowid]);
            } else {
                await runQuery(db, "INSERT INTO session (id, data) VALUES (?, ?)", ["creds", credsValue]);
            }
        }
        for (const key of Object.keys(sessionData)) {
            if (key === "creds") continue;
            const value = typeof sessionData[key] === "object" ? JSON.stringify(sessionData[key]) : sessionData[key];
            await runQuery(db, "REPLACE INTO session (id, data) VALUES (?, ?)", [key, value]);
        }
        await closeDatabase(db);
        await setSessionId(SESSION_ID);
        return sessionData;
    } catch {
        logger.error("No Migration");
        return;
    }
}

function openDatabase(dbPath: string): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) reject(err);
            else resolve(db);
        });
    });
}

function runQuery(db: sqlite3.Database, sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function closeDatabase(db: sqlite3.Database): Promise<void> {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function ensureSessionTable(db: sqlite3.Database): Promise<sqlite3.RunResult> {
    return runQuery(db, "CREATE TABLE IF NOT EXISTS session (id TEXT PRIMARY KEY, data TEXT)");
}

function getFirstRow(db: sqlite3.Database): Promise<any> {
    return new Promise((resolve, reject) => {
        db.get("SELECT rowid FROM session ORDER BY rowid ASC LIMIT 1", (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}
