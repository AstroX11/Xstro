// database.mjs
import { DatabaseSync } from "node:sqlite";

let database: DatabaseSync | null = null;

/** Function that allows other functions to manage data in our Sqlite3 DataBase */
export const getDb = (): DatabaseSync => {
    if (!database) {
        database = new DatabaseSync("database.db", {
            enableForeignKeyConstraints: true,
            open: true,
        });
    }
    return database;
};
