import { type WAMessage, type WAMessageContent, type WAMessageKey, WAProto } from 'baileys';
import database from '../core/database.ts';

const messageDb = database.define(
  'messages',
  {
    id: { type: 'STRING', allowNull: false, primaryKey: true },
    message: { type: 'STRING', allowNull: true },
  },
  { freezeTableName: true },
);

export async function storeMessages(message: WAMessage) {
  await messageDb.create({ id: message.key.id, message: JSON.stringify(message) });
}

export async function getMessage(key: WAMessageKey): Promise<WAMessageContent | undefined> {
  if (!key.id) return undefined;

  const message = (await messageDb.findOne({ where: { id: key.id } })) as WAMessage;
  if (!message || !message.message) return undefined;

  const parsed: WAMessage = JSON.parse(message.message as string);
  return parsed.message ? WAProto.Message.fromObject(parsed.message) : undefined;
}

export async function getLastMessagesFromChat(jid: string): Promise<WAMessage[] | undefined> {
  const store = (await messageDb.findAll({})) as string[];
  if (!store || store.length === 0) return undefined;

  const messages: WAMessage[] = store
    .map((msg: any) => JSON.parse(msg.message) as WAMessage)
    .filter((parsed: WAMessage) => parsed.key?.remoteJid === jid);

  return messages.length > 0 ? messages : undefined;
}
