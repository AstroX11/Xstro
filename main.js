import * as bot from "./release/index.mjs";

/** Basic setup */

(async (
    config = {
        SESSION_ID: undefined,
        BOT_INFO: undefined,
        Migrate: false,
        oldsession: { folder: "", database: "" },
    }
) => {
    await bot.loadPlugins();
    if (config.Migrate) {
        await bot.SessionMigrator(config.oldsession.folder, config.oldsession.database, config.SESSION_ID);
    }
    await bot.client();
})();
