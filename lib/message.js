import { getContentType, isJidGroup, jidNormalizedUser, normalizeMessageContent } from 'baileys';
import { getConfig, isBanned, isSudo } from '#sql';

export async function serialize(messages, conn) {
  const owner = jidNormalizedUser(conn.user.id);
  const isGroup = isJidGroup(messages.key.remoteJid);
  const remoteJid = isGroup ? messages.key.remoteJid : jidNormalizedUser(messages.key.remoteJid);
  const { PREFIX, mode } = await getConfig();

  const sender = isGroup
    ? (messages.key?.participant ?? '')
    : messages.key?.fromMe
      ? (owner ?? '')
      : jidNormalizedUser(messages.key?.remoteJid ?? '');

  const msg = {
    key: {
      id: messages.key.id,
      fromMe: messages.key.fromMe,
      remoteJid,
      participant: isGroup ? messages.key.participant : undefined,
    },
    prefix: PREFIX,
    mode: mode,
    user: owner,
    sudo: isSudo([sender]),
    isban: await isBanned(sender),
    from: messages.key.remoteJid,
    pushName: messages.pushName,
    bizname: messages.verifiedBizName || false,
    sender: sender,
    isGroup,
    client: conn,
  };

  if (isGroup) {
    const metadata = await conn.groupMetadata(remoteJid);
    const participant = messages.key.participant;
    msg.isAdmin = !!metadata.participants.find((p) => p.id === participant)?.admin || false;
    msg.isBotAdmin = !!metadata.participants.find((p) => p.id === owner)?.admin || false;
  }

  if (messages.message) {
    const message_bot = normalizeMessageContent(messages.message);
    const message_type = getContentType(message_bot);
    const getPollBody = (normalizedMessage) => {
      if (normalizedMessage?.pollCreationMessageV3) {
        const pollData = normalizedMessage.pollCreationMessageV3;
        return [pollData.name, ...pollData.options.map((option) => option.optionName)].join(', ');
      }
      return false;
    };
    Object.assign(msg, {
      message: message_bot,
      type: message_type,
      participant: msg.key.participant || msg.key.remoteJid,
      mention: message_bot?.[message_type]?.contextInfo?.mentionedJid || [],
      viewonce: message_bot?.[message_type]?.viewOnce || false,
      body:
        message_bot?.[message_type]?.editedMessage?.conversation ||
        message_bot?.[message_type]?.editedMessage?.text ||
        message_bot?.[message_type]?.editedMessage?.caption ||
        message_bot?.conversation ||
        message_bot?.[message_type]?.text ||
        message_bot?.[message_type]?.caption ||
        getPollBody(message_bot) ||
        message_bot?.eventMessage?.name ||
        false,
    });
  }

  const InquotedType = getContentType(messages.message);
  const deepQuotedType = getContentType(messages.message?.[InquotedType]?.message);

  const quoted =
    messages.message?.[msg.type]?.contextInfo?.quotedMessage ||
    normalizeMessageContent(
      normalizeMessageContent(
        messages.message?.[InquotedType]?.message?.[deepQuotedType]?.contextInfo?.quotedMessage
      )
    );

  if (quoted) {
    const quotedMessage = normalizeMessageContent(quoted);
    const quotedType = getContentType(quotedMessage);
    const stanzaId =
      messages.message?.[msg.type]?.contextInfo?.stanzaId ||
      normalizeMessageContent(
        normalizeMessageContent(
          messages.message?.[InquotedType]?.message?.[deepQuotedType]?.contextInfo?.stanzaId
        )
      );
    msg.quoted = {
      key: {
        id: normalizeMessageContent(stanzaId) || null,
        fromMe: messages.message?.[msg.type]?.contextInfo?.participant === owner,
        remoteJid: msg.key.remoteJid,
        participant: isGroup
          ? normalizeMessageContent(messages.message?.[InquotedType]?.contextInfo?.participant)
          : undefined,
      },
      message: quotedMessage,
      type: quotedType,
      viewonce: quotedMessage?.[quotedType]?.viewOnce || false,
      body:
        quotedMessage?.conversation ||
        quotedMessage?.[quotedType]?.text ||
        quotedMessage?.[quotedType]?.caption ||
        false,
    };
  } else {
    msg.quoted = null;
  }

  Object.defineProperty(msg, 'client', {
    get: function () {
      return conn;
    },
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(msg, 'send', {
    value: async (content, options = {}) => {
      const jid = options.jid || msg.key.remoteJid;
      const data = await conn.sendMessage(
        jid,
        { [options.type || 'text']: content, ...options },
        { quoted: msg || options.quoted }
      );
      return serialize(data, conn);
    },
    enumerable: false,
    writable: false,
    configurable: false,
  });

  Object.defineProperty(msg, 'error', {
    value: async (cmd, error) => {
      await msg.send(`"${cmd.pattern.toString().toLowerCase().split(/\W+/)[1]}" ᴄᴏᴍᴍᴀɴᴅ ᴇʀʀᴏʀ`);
      const name = cmd.pattern.toString().toLowerCase().split(/\W+/)[1];
      const { stack, message } = error;
      const data = await msg.send(`─━❲ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗘𝗥𝗥𝗢𝗥 ❳━─\n\n𝗙𝗥𝗢𝗠: ${name}\n\n𝗗𝗘𝗧𝗔𝗜𝗟𝗦: ${message}`, {
        jid: owner,
      });
      return serialize(data, conn) && console.log(stack);
    },
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return msg;
}
