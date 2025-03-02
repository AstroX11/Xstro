import { WAProto, WASocket, WAMessage } from "baileys";
import { XMsg } from "./core/message.mjs";

export type Client = WASocket;

export type cmdCategories = "misc" | "system" | "settings" | "tools" | "whatsapp" | "group" | "news" | "chats" | "download";

export interface Command {
    /** Name of function */
    name: RegExp | string;
    /** Should the command always run when it recieves a messgae */
    on?: string | undefined;
    /** Function of the command, must be async */
    function?: (message: XMsg, match?: string) => Promise<any>;
    /** Should the command be for only sudo and bot owner */
    fromMe?: boolean;
    /** Should the command only be for Groups */
    isGroup?: boolean;
    /** Description of what the command does */
    desc: string | undefined;
    /** Category of where the command should below */
    type: cmdCategories;
    /** Should the command appear on the menu list? */
    dontAddCommandList?: boolean;
}

export type Config = {
    /** Prefixs unlimted */
    prefix: string[];
    /** Is the bot on private or public mode */
    mode: boolean;
    /** Auto read your messages, bluetick */
    autoRead: boolean;
    /** Auto read your contacts status */
    autoStatusRead: boolean;
    /** Auto like a contact status post */
    autolikestatus: boolean;
    /** Should the bot operate in groups? */
    disablegc: boolean;
    /** Should the bot operate in other personal chats excluding yours */
    disabledm: boolean;
    /** Should the bot always react before excuting a command */
    cmdReact: boolean;
    /** Should the bot bluetick any message that tiggers it to run a command? */
    cmdRead: boolean;
    /** Should the bot automatically save contact status */
    savebroadcast: boolean;
    /** List of disabled commands that the bot won't excute */
    disabledCmds: string[];
    /** List of all sudo numbers in jid format */
    sudo: string[];
    /** List of all banned users in jid format */
    banned: string[];
};

// Message Sending
export interface MessageMisc {
    /** Who to send the message to */
    jid: string;
    /** ContextInfo of the message */
    contextInfo?: WAProto.IContextInfo;
    /** mention users */
    mentions?: string[];
    /** type of message, text,audio, video, document etc, leave empty for automatic dectection */
    type?: "text" | "audio" | "image" | "video" | "sticker" | "document";
    /** custom mimetype, xstro auto generates one */
    mimetype?: string;
    /** should the message disapper from chat */
    disappearingMessagesInChat?: boolean | number;
    /** Name of the file if sending as document */
    fileName?: string;
    /** should send file as push to talk? */
    ptt?: boolean;
    /** should send file as video note? */
    ptv?: boolean;
    /** caption for video or audio message */
    caption?: string;
    /** choose through if you want the message to play as gif */
    gifPlayback?: boolean;
    /** Wa message */
    quoted?: WAMessage;
    /** idk */
    ephemeralExpiration?: number | string;
}
