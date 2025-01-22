import { getAntiDelete } from '#sql';
import { isMediaMessage, formatTime } from '#utils';

export async function AntiDelete(msg) {
  if (
    !(await getAntiDelete()) ||
    msg.type !== 'protocolMessage' ||
    msg?.message?.protocolMessage?.type !== 'REVOKE'
  ) {
    return;
  }

  const client = msg.client;
  const messageId = msg?.message?.protocolMessage?.key.id;
  const store = await client.loadMessage(messageId);
  const sender = store.message.sender;
  const deleted = msg?.sender;
  const time = formatTime(Date.now());
  const message = store.message.message;
  const chat = msg.isGroup ? msg.from : msg.user;

  if (!isMediaMessage(message)) {
    const content = message.conversation || message.extendedTextMessage?.text;
    const textContent = {
      header: '*ᴍᴇssᴀɢᴇ ᴡᴀs ᴅᴇʟᴇᴛᴇᴅ*\n',
      sender: `*sᴇɴᴅᴇʀ:* @${sender.split('@')[0]}`,
      deleter: `*ᴅᴇʟᴇᴛᴇᴅ ʙʏ:* @${deleted.split('@')[0]}`,
      timestamp: `*ᴀᴛ*: ${time}`,
      content: `*ʀᴇᴄᴏᴠᴇʀᴇᴅ ᴄᴏɴᴛᴇɴᴛ:*\n${content}`,
    };

    const groupInfo = msg.isGroup
      ? `*ɢʀᴏᴜᴘ:* ${(await client.groupMetadata(msg.from)).subject}\n`
      : '';

    const text = [
      textContent.header,
      groupInfo,
      textContent.sender,
      textContent.deleter,
      textContent.timestamp,
      textContent.content,
    ].join('\n');

    await client.sendMessage(
      chat,
      { text, mentions: [sender, deleted] },
      { quoted: store.message }
    );
  } else {
    await client.sendMessage(
      chat,
      {
        forward: store.message,
        contextInfo: { isFowarded: false },
      },
      { quoted: store.message }
    );
  }
}
