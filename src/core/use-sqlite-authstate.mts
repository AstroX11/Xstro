import { DatabaseSync, StatementSync, SupportedValueType } from "node:sqlite";
import { WAProto, AuthenticationCreds, AuthenticationState, initAuthCreds, BufferJSON } from "baileys";

interface QueueItem {
    id: string;
    data: string | null;
}

interface DBRow {
    id: string;
    data: string;
}

export const useSQLiteAuthState = async (database: string): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
    // Enhanced memory cache with size limit
    const cache = new Map<string, any>();
    const MAX_CACHE_SIZE = 10000;

    const db = new DatabaseSync(database, { open: true });
    db.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA temp_store = MEMORY;
        PRAGMA cache_size = -2000;
        PRAGMA mmap_size = 30000000000;
        CREATE TABLE IF NOT EXISTS session (
            id TEXT PRIMARY KEY,
            data TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_session_id ON session(id);
    `);

    // Batch processing queue
    let writeQueue: QueueItem[] = [];
    let writeTimer: NodeJS.Timeout | null = null;
    const BATCH_DELAY = 50; // ms

    const processBatchWrites = (): void => {
        if (writeQueue.length === 0) return;

        const currentQueue = writeQueue;
        writeQueue = [];
        writeTimer = null;

        try {
            db.exec("BEGIN TRANSACTION");
            const stmt: StatementSync = db.prepare("INSERT INTO session (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data");

            currentQueue.forEach(({ id, data }) => {
                if (data !== null) {
                    const params: SupportedValueType[] = [id, data];
                    stmt.run(...params);
                }
            });

            db.exec("COMMIT");
        } catch (error) {
            console.error("Batch write error:", error);
            // Re-queue failed writes
            writeQueue = [...currentQueue, ...writeQueue];
            scheduleBatchWrite();
        }
    };

    const scheduleBatchWrite = (): void => {
        if (!writeTimer && writeQueue.length > 0) {
            writeTimer = setTimeout(processBatchWrites, BATCH_DELAY);
        }
    };

    const readData = <T extends unknown>(type: string, id?: string): T | null => {
        const sessionId = id ? `${type}:${id}` : type;

        // Check cache first
        if (cache.has(sessionId)) {
            return cache.get(sessionId) as T;
        }

        const stmt: StatementSync = db.prepare("SELECT data FROM session WHERE id = ?");
        const row = stmt.get(sessionId) as DBRow | undefined;
        if (!row) return null;

        try {
            const data = JSON.parse(row.data, BufferJSON.reviver) as T;
            // Update cache with size limit check
            if (cache.size >= MAX_CACHE_SIZE) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey!);
            }
            cache.set(sessionId, data);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const writeData = (type: string, id: string | null, data: any): void => {
        const sessionId = id ? `${type}:${id}` : type;
        const serialized = JSON.stringify(data, BufferJSON.replacer);

        // Update cache immediately
        if (cache.size >= MAX_CACHE_SIZE) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey!);
        }
        cache.set(sessionId, data);

        // Add to batch queue
        writeQueue.push({ id: sessionId, data: serialized });
        scheduleBatchWrite();
    };

    const deleteData = (type: string, id: string): void => {
        const sessionId = `${type}:${id}`;
        cache.delete(sessionId);

        const stmt: StatementSync = db.prepare("DELETE FROM session WHERE id = ?");
        stmt.run(sessionId);
    };

    // Initialize credentials
    const credsData = readData<AuthenticationCreds>("creds");
    const creds = credsData || initAuthCreds();
    if (!credsData) {
        writeData("creds", null, creds);
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type: string, ids: string[]): Promise<Record<string, any>> => {
                    const result: Record<string, any> = {};
                    const uncachedIds: string[] = [];

                    // Process cached items first
                    for (const id of ids) {
                        const sessionId = `${type}:${id}`;
                        if (cache.has(sessionId)) {
                            let data = cache.get(sessionId);
                            if (type === "app-state-sync-key") {
                                data = WAProto.Message.AppStateSyncKeyData.fromObject(data);
                            }
                            result[id] = data;
                        } else {
                            uncachedIds.push(id);
                        }
                    }

                    if (uncachedIds.length === 0) return result;

                    // Batch fetch uncached items
                    const sessionIds = uncachedIds.map((id) => `${type}:${id}`);
                    const placeholders = sessionIds.map(() => "?").join(",");
                    const query = `SELECT id, data FROM session WHERE id IN (${placeholders})`;
                    const stmt: StatementSync = db.prepare(query);
                    const rows = stmt.all(...sessionIds) as DBRow[] | undefined;

                    if (rows) {
                        rows.forEach((row) => {
                            try {
                                const originalId = row.id.split(":")[1];
                                let data = JSON.parse(row.data, BufferJSON.reviver);
                                if (type === "app-state-sync-key") {
                                    data = WAProto.Message.AppStateSyncKeyData.fromObject(data);
                                }
                                if (cache.size >= MAX_CACHE_SIZE) {
                                    const firstKey = cache.keys().next().value;
                                    cache.delete(firstKey!);
                                }
                                cache.set(row.id, data);
                                result[originalId] = data;
                            } catch (error) {
                                console.error("Parse error:", error);
                            }
                        });
                    }

                    // Set null for missing IDs
                    ids.forEach((id) => {
                        if (!(id in result)) {
                            result[id] = null;
                        }
                    });

                    return result;
                },
                set: async (data: Record<string, Record<string, any>>): Promise<void> => {
                    const batchWrites: QueueItem[] = [];

                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const sessionId = `${category}:${id}`;

                            if (value) {
                                if (cache.size >= MAX_CACHE_SIZE) {
                                    const firstKey = cache.keys().next().value;
                                    cache.delete(firstKey!);
                                }
                                cache.set(sessionId, value);
                                batchWrites.push({
                                    id: sessionId,
                                    data: JSON.stringify(value, BufferJSON.replacer),
                                });
                            } else {
                                cache.delete(sessionId);
                                batchWrites.push({
                                    id: sessionId,
                                    data: null,
                                });
                            }
                        }
                    }

                    // Add all operations to batch queue
                    writeQueue.push(...batchWrites);
                    scheduleBatchWrite();
                },
            },
        },
        saveCreds: () => {
            return new Promise<void>((resolve) => {
                writeData("creds", null, creds);
                // Wait for batch to process
                setTimeout(resolve, BATCH_DELAY + 10);
            });
        },
    };
};
