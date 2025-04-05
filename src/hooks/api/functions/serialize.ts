import { promises as fs } from 'fs';
import { join } from 'path';
import { Boom } from '@hapi/boom';
import {
  downloadMediaMessage,
  getContentType,
  isJidBroadcast,
  isJidGroup,
  normalizeMessageContent,
  type AnyMessageContent,
  type WAContextInfo,
  type WAMessage,
  type WAMessageKey,
  type WASocket,
} from 'baileys';
import type { MessageMisc } from '../../../@types/command.ts';
import { prepareMessage } from './prepareMessage.ts';
import { parseJid } from '../../../utils/constants.ts';
import { extractStringfromMessage } from '../../../utils/extractor.ts';
import { getSudo } from '../../../models/sudo.ts';
import { isMediaMessage } from '../../../utils/content.ts';
import logger from '../../../utils/logger.ts';
import { getSettings } from '../../../models/settings.ts';

export async function serialize(client: WASocket, messages: WAMessage) {
  const normalizedMessages = {
    ...messages,
    message: normalizeMessageContent(messages?.message),
  };
  const { key, message, ...msg } = normalizedMessages;
  const { prefix, mode } = await getSettings();
  const owner = parseJid(client?.user!.id);
  const sender =
    isJidGroup(key.remoteJid!) || msg.broadcast
      ? key.participant
      : key.fromMe
        ? owner
        : key.remoteJid;
  const mtype = getContentType(message);
  function hasContextInfo(msg: unknown): msg is { contextInfo: WAContextInfo } {
    if (!msg || typeof msg !== 'object' || msg === null) return false;
    return (
      'contextInfo' in msg && msg?.contextInfo !== null && typeof msg?.contextInfo === 'object'
    );
  }
  const messageContent = message?.[mtype!];
  const Quoted = hasContextInfo(messageContent) ? messageContent!?.contextInfo : undefined;
  const quotedM = Quoted ? normalizeMessageContent(Quoted!?.quotedMessage) : undefined;

  return {
    key,
    message,
    mtype,
    jid: key.remoteJid!,
    isGroup: isJidGroup(key.remoteJid!),
    owner: owner,
    prefix: prefix,
    sender: sender,
    text: extractStringfromMessage(message!),
    mentions: Quoted ? Quoted.mentionedJid : [],
    mode,
    sudo: (await getSudo())?.includes(sender!) || sender === owner,
    user: function (match?: string): string | undefined {
      if (this.isGroup) {
        if (this.quoted && this.quoted.sender) return this.quoted.sender;
        if (match && Array.isArray(match)) return parseJid(match[0]);
        if (match && !Array.isArray(match)) return parseJid(match);
      } else {
        if (this.quoted && this.quoted.sender) return this.quoted.sender;
        if (match) return parseJid(match);
        if (!match) return this.jid;
      }
      return undefined;
    },
    quoted:
      Quoted && quotedM
        ? {
            key: {
              remoteJid: key.remoteJid,
              fromMe: Quoted.participant === owner,
              id: Quoted.stanzaId,
              participant:
                isJidGroup(key.remoteJid!) || isJidBroadcast(key.remoteJid!)
                  ? Quoted.participant
                  : undefined,
            },
            message: quotedM,
            type: getContentType(quotedM),
            sender: Quoted.participant!,
            text: extractStringfromMessage(quotedM),
            viewOnce:
              quotedM?.audioMessage?.viewOnce ??
              quotedM?.videoMessage?.viewOnce ??
              quotedM?.imageMessage?.viewOnce ??
              undefined,
            broadcast: Boolean(Quoted.remoteJid!),
            ...(({ quotedMessage, stanzaId, remoteJid, ...rest }): WAContextInfo => rest)(Quoted),
          }
        : undefined,
    isAdmin: async function (): Promise<boolean | unknown[]> {
      const metadata = await this.groupMetadata(this.jid);
      const allAdmins = metadata.participants.filter((v) => v.admin !== null).map((v) => v.id);
      return !Array.isArray(allAdmins) ? Array.from(allAdmins) : allAdmins.includes(sender!);
    },
    isBotAdmin: async function (): Promise<boolean | unknown[]> {
      const metadata = await this.groupMetadata(this.jid);
      const allAdmins = metadata.participants.filter((v) => v.admin !== null).map((v) => v.id);
      return !Array.isArray(allAdmins) ? Array.from(allAdmins) : allAdmins.includes(this.owner!);
    },
    send: async function (
      content: string | Buffer,
      options?: MessageMisc & Partial<AnyMessageContent>,
    ) {
      const jid = options?.jid ?? this.jid;
      const updatedOptions = { ...options, jid };
      return await prepareMessage(
        async (c, m) => await serialize(c, m),
        client,
        content,
        updatedOptions,
      );
    },
    edit: async function (text: string, key?: WAMessageKey): Promise<WAMessage | undefined> {
      return await client.sendMessage(this.jid, {
        text: text,
        edit: key || this.quoted?.key || this.key,
      });
    },
    async downloadM(
      message: WAMessage,
      shouldSaveasFile?: boolean,
    ): Promise<string | Buffer<ArrayBufferLike> | undefined> {
      try {
        const media = await downloadMediaMessage(message, 'buffer', {});
        if (shouldSaveasFile) {
          const saves = './downloads';
          const fileName = `${message.key.id}_${Date.now()}.bin`;
          const savePath = join(saves, fileName);
          await fs.mkdir(saves, { recursive: true });
          await fs.writeFile(savePath, media);
          return savePath;
        }
        return media;
      } catch (error) {
        logger.error(`Error while downloading:`, error as string);
      }
    },
    forward: async function (
      jid: string,
      message: WAMessage,
      opts?: { quoted?: WAMessage; contextInfo?: WAContextInfo },
    ): Promise<WAMessage | undefined> {
      if (!message || !jid) {
        throw new Boom('Illegal there must be a Vaild Web Message and a Jid');
      }
      return await client.sendMessage(
        jid,
        {
          forward: message,
          ...opts,
          contextInfo: { isForwarded: false, forwardingScore: 0, ...opts },
        },
        { ...opts },
      );
    },
    react: async function (emoji: string, message?: WAMessage): Promise<WAMessage | undefined> {
      return await client.sendMessage(this.jid, {
        react: { text: emoji, key: message?.key ? this.quoted?.key : this.key },
      });
    },
    delete: async function (message: WAMessage): Promise<void | WAMessage> {
      // If (group AND bot is not admin) OR (not a group AND message not from me), delete for me
      if ((this.isGroup && !(await this.isBotAdmin())) || (!this.isGroup && !message?.key.fromMe)) {
        return this.chatModify(
          {
            deleteForMe: {
              deleteMedia: isMediaMessage(message),
              key: message.key,
              timestamp: Date.now(),
            },
          },
          this.jid,
        );
      }

      // Otherwise, delete normally (for everyone)
      return await this.sendMessage(this.jid, { delete: message.key });
    },
    ...msg,
    ...(({ logger, ws, authState, signalRepository, user, ...rest }) => rest)(client),
  };
}
