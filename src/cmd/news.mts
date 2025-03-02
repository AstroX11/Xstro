import { XMessage, Module, voxnews, wabetanews } from "../index.mjs";

Module({
    name: "news",
    fromMe: false,
    desc: "Get News from Vox",
    type: "news",
    function: async (message: XMessage) => {
        const news = await voxnews();
        if (!news) return message.send("No news avaliable");
        return await message.send(news);
    },
});

Module({
    name: "wabeta",
    fromMe: false,
    desc: "Get WABeta News",
    type: "news",
    function: async (message: XMessage) => {
        const wabetaInfo = await wabetanews();
        if (!wabetaInfo) return message.send("No WA updates avaliable");
        return await message.send(wabetaInfo);
    },
});
