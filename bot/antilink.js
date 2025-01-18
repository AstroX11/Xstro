import { config } from '#config';
import { isJidGroup } from 'baileys';
import { getAntilink, incrementWarningCount, resetWarningCount, isSudo } from '#sql';

const { WARN_COUNT } = config;

/**
 * Checks if a string contains a URL.
 *
 * @param {string} str - The string to check.
 * @returns {boolean} - True if the string contains a URL, otherwise false.
 */
function containsURL(str) {
  const urlRegex = /(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/i;
  return urlRegex.test(str);
}

/**
 * Handles the Antilink functionality for group chats by detecting and managing messages containing URLs.
 * 
 * @param {object} msg - The message object to be processed for antilink checks.
 * @async
 * @description Performs the following actions based on group antilink configuration:
 * - Checks if the message is from a group chat
 * - Validates message content
 * - Skips processing for group owners, sudo users, and admins
 * - Detects URLs in the message
 * - Applies configured actions: delete, kick, or warn
 * 
 * @returns {Promise<void>} A promise that resolves after processing the message
 * 
 * @throws {Error} Potential errors during message processing or group management
 */
export async function Antilink(msg) {
  const jid = msg.from;
  if (!isJidGroup(jid)) return;

  const SenderMessage = msg.body;
  if (!SenderMessage || typeof SenderMessage !== 'string') return;

  const sender = msg.sender;
  if (!sender) return;
  if (msg.sender === msg.owner || (await isSudo(sender)) || msg.isAdmin) return;
  if (!containsURL(SenderMessage.trim())) return;
  const antilinkConfig = await getAntilink(jid, 'on');
  if (!antilinkConfig) return;
  const action = antilinkConfig.action;
  await msg.client.sendMessage(jid, { delete: msg?.key });

  if (action === 'delete') {
    await msg.client.sendMessage(jid, { delete: msg?.key });
    return await msg.send(`\`\`\`@${msg.sender.split('@')[0]} link are not allowed here\`\`\``, {
      mentions: [msg.sender],
    });
  } else if (action === 'kick') {
    await msg.client.sendMessage(jid, { delete: msg?.key });
    await msg.client.groupParticipantsUpdate(jid, [sender], 'remove');
    return await msg.send(
      `\`\`\`@${msg.sender.split('@')[0]} has been kicked for sending links, no link allowed kid\`\`\``,
      { mentions: [msg.sender] }
    );
  } else if (action === 'warn') {
    const warningCount = await incrementWarningCount(jid, 'on');
    if (warningCount <= WARN_COUNT) {
      await msg.send(
        `\`\`\`@${msg.sender.split('@')[0]} no links are allowed in this group! you have been warned.\n${WARN_COUNT - warningCount} warnings left before you could be kicked out.\`\`\``,
        { mentions: [msg.sender] }
      );
      if (warningCount === WARN_COUNT) {
        await msg.client.groupParticipantsUpdate(jid, [sender], 'remove');
        await resetWarningCount(jid, 'on');
        return await msg.send(
          `\`\`\`@${msg.sender.split('@')[0]} has been kicked for sending links, no link allowed kid\`\`\``,
          { mentions: [msg.sender] }
        );
      }
    } else {
      await msg.client.groupParticipantsUpdate(jid, [sender], 'remove');
      await resetWarningCount(jid, 'on');
      return await msg.send(
        `\`\`\`@${msg.sender.split('@')[0]} has been kicked for sending links, no link allowed kid\`\`\``,
        { mentions: [msg.sender] }
      );
    }
  }
}
