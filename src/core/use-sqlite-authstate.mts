import { DatabaseSync } from "node:sqlite";
import { AuthenticationCreds, AuthenticationState, SignalDataTypeMap, initAuthCreds, BufferJSON, WAProto } from "baileys";

interface SqliteAuthStateConfig {
    /**
     * Enable WAL mode for better concurrent performance
     * @default true
     */
    enableWAL?: boolean;
}

export const useSqliteAuthState = (database: DatabaseSync, config: SqliteAuthStateConfig = {}): { state: AuthenticationState; saveCreds: () => void } => {
    // Initialize database schema
    database.exec(`
        CREATE TABLE IF NOT EXISTS creds (
            id TEXT PRIMARY KEY DEFAULT 'default',
            data TEXT NOT NULL
        ) WITHOUT ROWID;

        CREATE TABLE IF NOT EXISTS auth_keys (
            type TEXT NOT NULL,
            id TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (type, id)
        ) WITHOUT ROWID;
    `);

    if (config.enableWAL ?? true) {
        database.exec("PRAGMA journal_mode = WAL;");
    }

    // Initialize credentials
    let creds: AuthenticationCreds;
    const credsStmt = database.prepare("SELECT data FROM creds WHERE id = ?");
    const credsRow = credsStmt.get("default") as { data: string } | undefined;

    if (credsRow) {
        creds = JSON.parse(credsRow.data, BufferJSON.reviver);
    } else {
        creds = initAuthCreds();
        const insertCreds = database.prepare("INSERT INTO creds (id, data) VALUES (?, ?)");
        insertCreds.run("default", JSON.stringify(creds, BufferJSON.replacer));
    }

    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};
                    const stmt = database.prepare(
                        `SELECT id, value FROM auth_keys 
                         WHERE type = ? AND id IN (${ids.map(() => "?").join(",")})`
                    );

                    const rows = stmt.all(type, ...ids) as Array<{ id: string; value: string }>;

                    for (const row of rows) {
                        let value = JSON.parse(row.value, BufferJSON.reviver);
                        if (type === "app-state-sync-key" && value) {
                            value = WAProto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[row.id] = value;
                    }

                    return data;
                },
                set: (data) => {
                    database.exec("BEGIN TRANSACTION");
                    try {
                        const insertStmt = database.prepare("INSERT OR REPLACE INTO auth_keys (type, id, value) VALUES (?, ?, ?)");

                        const deleteStmt = database.prepare("DELETE FROM auth_keys WHERE type = ? AND id = ?");

                        for (const category of Object.keys(data)) {
                            for (const id of Object.keys(data[category])) {
                                const value = data[category][id];

                                if (value) {
                                    insertStmt.run(category, id, JSON.stringify(value, BufferJSON.replacer));
                                } else {
                                    deleteStmt.run(category, id);
                                }
                            }
                        }
                        database.exec("COMMIT");
                    } catch (error) {
                        database.exec("ROLLBACK");
                        throw error;
                    }
                },
            },
        },
        saveCreds: () => {
            const stmt = database.prepare("UPDATE creds SET data = ? WHERE id = ?");
            stmt.run(JSON.stringify(creds, BufferJSON.replacer), "default");
        },
    };
};
