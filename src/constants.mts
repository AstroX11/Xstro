import { Boom } from "@hapi/boom";
import { fileTypeFromBuffer } from "file-type";
import got, { Options as gotOps } from "got";
import { getContentType, jidNormalizedUser, WAMessage, WAMessageContent } from "baileys";

export function isUrl(text: string): boolean {
    const urlRegex = /\bhttps?:\/\/[^\s/$.?#].[^\s]*|www\.[^\s/$.?#].[^\s]*\b/gi;
    return urlRegex.test(text);
}

export function formatBytes(bytes: number, decimals: number = 2): string {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return `${days}days ${hours}hr ${minutes}mins ${seconds}sec`;
}

export function runtime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const dDisplay = d > 0 ? `${d} d ` : "";
    const hDisplay = h > 0 ? `${h} h ` : "";
    const mDisplay = m > 0 ? `${m} m ` : "";
    const sDisplay = s > 0 ? `${s} s` : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

export const getFloor = (number: number): number => Math.floor(number);

export const getRandom = <T extends unknown>(array: T[]): T | undefined => {
    if (array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
};

export const numToJid = (num: string | number): string => {
    let strNum = typeof num === "string" ? num : num.toString();
    strNum = strNum.replace(/:\d+/, "").replace(/\D/g, "");
    return jidNormalizedUser(`${strNum}@s.whatsapp.net`);
};

export const extractUrl = (str: string): string | false => {
    const match = str.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : false;
};

export const convertTo24Hour = (timeStr: string): string | null => {
    const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])(am|pm)$/i;
    const match = timeStr.toLowerCase().match(timeRegex);
    if (!match) return null;
    let [_, hours, minutes, period] = match;
    let hour = parseInt(hours, 10);
    if (period === "pm" && hour !== 12) hour += 12;
    else if (period === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minutes}`;
};

export const convertTo12Hour = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    let period = "AM";
    let hour = hours;
    if (hour >= 12) {
        period = "PM";
        if (hour > 12) hour -= 12;
    }
    if (hour === 0) hour = 12;
    return `${hour}:${String(minutes).padStart(2, "0")}${period}`;
};

export const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    return `${hours}:${String(minutes).padStart(2, "0")}${ampm}`;
};

export const getDataType = async (content: Buffer | string): Promise<{ contentType: "text" | "audio" | "image" | "video" | "sticker" | "document"; mimeType: string }> => {
    if (typeof content === "string") content = Buffer.from(content);
    const data = await fileTypeFromBuffer(content);
    if (!data) {
        try {
            content.toString("utf8");
            return { contentType: "text", mimeType: "text/plain" };
        } catch {
            return { contentType: "document", mimeType: "application/octet-stream" };
        }
    }
    const mimeType = data.mime;
    if (mimeType.startsWith("text/")) {
        return { contentType: "text", mimeType };
    } else if (mimeType.startsWith("image/")) {
        return { contentType: "image", mimeType };
    } else if (mimeType.startsWith("video/")) {
        return { contentType: "video", mimeType };
    } else if (mimeType.startsWith("audio/")) {
        return { contentType: "audio", mimeType };
    } else {
        return { contentType: "document", mimeType };
    }
};

export const extractTextFromMessage = function (message: WAMessageContent) {
    if (!message) return undefined;

    if (message?.extendedTextMessage) {
        return message?.extendedTextMessage?.text ?? message?.extendedTextMessage?.description ?? message?.extendedTextMessage?.title;
    }
    if (message?.videoMessage) {
        return message?.videoMessage?.caption;
    }
    if (message?.imageMessage) {
        return message?.imageMessage?.caption;
    }
    if (message?.conversation) {
        return message?.conversation;
    }
    if (message?.eventMessage) {
        return `${message?.eventMessage?.name}\n${message?.eventMessage?.description}`;
    }
    if (message?.pollCreationMessageV3) {
        return `${message?.pollCreationMessageV3?.name}\n${message?.pollCreationMessageV3?.options?.map((opt) => opt.optionName).toString()}`;
    }
    if (message?.pollCreationMessage) {
        return `${message?.pollCreationMessage?.name}\n${message?.pollCreationMessage?.options?.map((opt) => opt.optionName).toString()}`;
    }
    if (message?.pollCreationMessageV2) {
        return `${message?.pollCreationMessageV2?.name}\n${message?.pollCreationMessageV2?.options?.map((opt) => opt.optionName).toString()}`;
    }
    if (message?.documentMessage) {
        return message?.documentMessage?.caption;
    }
    if (message?.protocolMessage) {
        if (message?.protocolMessage?.editedMessage?.extendedTextMessage) {
            return message?.protocolMessage?.editedMessage?.extendedTextMessage?.text;
        }
        if (message?.protocolMessage?.editedMessage?.videoMessage) {
            return message?.protocolMessage?.editedMessage?.videoMessage?.caption;
        }
        if (message?.protocolMessage?.editedMessage?.imageMessage) {
            return message?.protocolMessage?.editedMessage?.imageMessage?.caption;
        }
        if (message?.protocolMessage?.editedMessage?.conversation) {
            return message?.protocolMessage?.editedMessage?.conversation;
        }
        if (message?.protocolMessage?.editedMessage?.documentMessage) {
            return message?.protocolMessage?.editedMessage?.documentMessage?.caption;
        }
    }
};

export const fetchJson = async function (url: string, options?: gotOps): Promise<string> {
    try {
        const data = await got.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                Connection: "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                DNT: "1",
                ...options,
            },
            ...options,
        });
        return data.body;
    } catch (error) {
        throw new Boom(error.message);
    }
};

export const postJson = async function (url: string) {};

export const isMediaMessage = (message: WAMessage): boolean => {
    const mediaMessageTypes = ["imageMessage", "videoMessage", "audioMessage", "documentMessage"] as const;
    const content = getContentType(message?.message!);
    return typeof content === "string" && mediaMessageTypes.includes(content as (typeof mediaMessageTypes)[number]);
};

export async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return Buffer.from(result);
}
