import { Database } from "sqlite";
import { getDb } from "./database.mjs";
import { Config } from "../types.mjs";

async function initConfigDb(): Promise<void> {
    const db: Database = await getDb();
    await db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      UNIQUE(key)
    );
  `);

    const exists = await db.get("SELECT id FROM config LIMIT 1");
    if (!exists) {
        const defaultConfig = [
            { key: "prefix", value: "." },
            { key: "mode", value: "1" },
            { key: "autoRead", value: "0" },
            { key: "autoStatusRead", value: "0" },
            { key: "autolikestatus", value: "0" },
            { key: "disablegc", value: "0" },
            { key: "disabledm", value: "0" },
            { key: "cmdReact", value: "1" },
            { key: "cmdRead", value: "0" },
            { key: "savebroadcast", value: "0" },
            { key: "disabledCmds", value: "[]" },
            { key: "sudo", value: "[]" },
            { key: "banned", value: "[]" },
        ];

        const stmt = await db.prepare("INSERT INTO config (key, value) VALUES (?, ?)");
        for (const config of defaultConfig) {
            await stmt.run(config.key, config.value);
        }
        await stmt.finalize();
    }
}

export async function getConfig(): Promise<Config> {
    const db: Database = await getDb();
    await initConfigDb();

    const rows = await db.all("SELECT key, value FROM config");
    const configMap = Object.fromEntries(rows.map((row) => [row.key, row.value]));

    return {
        prefix: Array.from(configMap.prefix) || ".",
        mode: Boolean(parseInt(configMap.mode || "1")),
        autoRead: Boolean(parseInt(configMap.autoRead || "0")),
        autoStatusRead: Boolean(parseInt(configMap.autoStatusRead || "0")),
        autolikestatus: Boolean(parseInt(configMap.autolikestatus || "0")),
        disablegc: Boolean(parseInt(configMap.disablegc || "0")),
        disabledm: Boolean(parseInt(configMap.disabledm || "0")),
        cmdReact: Boolean(parseInt(configMap.cmdReact || "1")),
        cmdRead: Boolean(parseInt(configMap.cmdRead || "0")),
        savebroadcast: Boolean(parseInt(configMap.savebroadcast || "0")),
        disabledCmds: JSON.parse(configMap.disabledCmds || "[]"),
        sudo: JSON.parse(configMap.sudo || "[]"),
        banned: JSON.parse(configMap.banned || "[]"),
    };
}

export async function editConfig(updates: Partial<Config>): Promise<Config | null> {
    const db: Database = await getDb();
    await initConfigDb();

    const allowedKeys: (keyof Config)[] = [
        "prefix",
        "mode",
        "autoRead",
        "autoStatusRead",
        "autolikestatus",
        "disablegc",
        "disabledm",
        "cmdReact",
        "cmdRead",
        "savebroadcast",
        "disabledCmds",
        "sudo",
        "banned",
    ];

    const keys = Object.keys(updates).filter((key) => allowedKeys.includes(key as keyof Config));
    if (!keys.length) return null;

    const stmt = await db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)");
    for (const key of keys) {
        const value = updates[key as keyof Config];
        let dbValue: string;

        if (typeof value === "boolean") {
            dbValue = value ? "1" : "0";
        } else if (Array.isArray(value)) {
            dbValue = JSON.stringify(value);
        } else {
            dbValue = String(value);
        }

        await stmt.run(key, dbValue);
    }
    await stmt.finalize();

    return getConfig();
}
