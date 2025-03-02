import { Database } from "sqlite";
import { getDb } from "./database.mjs";

async function Antiword(): Promise<void> {
    const db: Database = await getDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS antiword (
            id TEXT PRIMARY KEY,
            status INTEGER CHECK (status IN (0, 1)),
            words TEXT
        )
    `);
}

export async function setAntiword(id: string, status: number, words: string[]): Promise<{ success: boolean; added: number }> {
    await Antiword();
    const db: Database = await getDb();
    const existing = await db.get("SELECT words FROM antiword WHERE id = ?", id);
    const existingWords = existing?.words ? JSON.parse(existing.words) : [];
    const uniqueWords = [...new Set([...existingWords, ...words])];
    const added = uniqueWords.length - existingWords.length;

    await db.run("INSERT OR REPLACE INTO antiword (id, status, words) VALUES (?, ?, ?)", id, status, JSON.stringify(uniqueWords));

    return { success: true, added };
}

export async function delAntiword(id: string): Promise<boolean> {
    await Antiword();
    const db: Database = await getDb();
    const result = await db.run("DELETE FROM antiword WHERE id = ?", id);
    return result.changes! > 0;
}

export async function getAntiword(id: string): Promise<{ status: boolean; words: string[] } | null> {
    await Antiword();
    const db: Database = await getDb();
    const result = await db.get("SELECT status, words FROM antiword WHERE id = ?", id);
    if (!result) return null;
    return { status: Boolean(result.status), words: JSON.parse(result.words) };
}
