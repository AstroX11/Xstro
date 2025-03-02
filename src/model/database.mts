import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

let database: Database | null = null;

/** Function that allows other functions to manage data in our Sqlite3 DataBase */
export const getDb = async (): Promise<Database> => {
    if (!database) {
        database = await open({
            filename: "database.db",
            driver: sqlite3.Database,
        });
    }
    return database;
};
