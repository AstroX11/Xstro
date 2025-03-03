import * as bot from "./release/index.mjs";

/** Basic setup */

(async () => {
    await bot.loadPlugins();
    await bot.client();
})();

export const INSTANCE_ = {
    SESSION: process.env.SESSION ?? "" /** Custom session goes here */,
    BOT_INFO: process.env.BOT_INFO ?? "" /** Settings such as owner's name and bot name*/,
    WARNS: process.env.WARNS ?? 3 /** Warnings count before taking various security actions */,
};
