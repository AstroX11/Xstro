import { XMsg, Module, voxnews, wabetanews } from "#core";

Module({
    name: "news",
    fromMe: false,
    desc: "Get News from Vox",
    type: "news",
    function: async (message: XMsg) => {
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
    function: async (message: XMsg) => {
        const wabetaInfo = await wabetanews();
        if (!wabetaInfo) return message.send("No WA updates avaliable");
        return await message.send(wabetaInfo);
    },
});
