import { getAntiSpamMode, isSudo } from '#sql';
import { isJidGroup } from 'baileys';
const messageStore = new Map();
const deleteCount = new Map();

/**
 * Implements anti-spam functionality for chat messages.
 * 
 * @param {Object} msg - The message object to be processed for spam detection.
 * @param {string} msg.from - The chat identifier where the message was sent.
 * @param {boolean} msg.isStatus - Flag indicating if the message is a status update.
 * @param {string} msg.sender - The identifier of the message sender.
 * @param {string} msg.user - The current user context.
 * @param {boolean} msg.isAdmin - Flag indicating if the sender is an admin.
 * @param {Object} msg.client - The messaging client for performing actions.
 * @param {Function} msg.send - Method to send messages.
 * 
 * @returns {Promise<void>} A promise that resolves after processing the anti-spam checks.
 * 
 * @description
 * Checks messages for spam behavior in both group and individual chat contexts.
 * - Skips processing for status messages, sudo users, and admin messages
 * - Tracks message frequency within a 10-second window
 * - Supports different anti-spam modes: 'off', 'delete' (for groups), and 'block' (for individual chats)
 * - Can delete multiple recent messages or block/remove spamming users
 */
export async function AntiSpammer(msg) {
  if (!msg.from || msg.isStatus || (await isSudo(msg.sender, msg.user))) return;
  const isGroup = isJidGroup(msg.from);
  const sender = msg.sender;
  const mode = await getAntiSpamMode(isGroup ? msg.from : 'global');
  if (mode === 'off' || msg.isAdmin) return;

  const now = Date.now();
  const senderKey = `${msg.from}-${sender}`;
  const userMessages = messageStore.get(senderKey) || [];
  userMessages.push({ timestamp: now, key: msg.key });

  const recentMessages = userMessages.filter((msgInfo) => now - msgInfo.timestamp <= 10000);
  messageStore.set(senderKey, recentMessages);
  if (recentMessages.length < 3) return;
  if (isGroup && mode === 'delete') {
    for (const msgInfo of recentMessages) {
      await msg.client.sendMessage(msg.from, {
        delete: msgInfo.key,
      });
    }
    deleteCount.set(sender, (deleteCount.get(sender) || 0) + 1);
    if (deleteCount.get(sender) > 2) {
      await msg.client.groupParticipantsUpdate(msg.from, [sender], 'remove');
    }
    await msg.send(
      `\`\`\`@${sender.split('@')[0]} your messages have been deleted as they were detected as spam. Be careful, kid!\`\`\``,
      { mentions: [sender] }
    );
  } else if (!isGroup && mode === 'block') {
    await msg.send(`\`\`\`@${sender.split('@')[0]} you have been blocked for spamming\`\`\``, {
      mentions: [sender],
    });
    return await msg.client.updateBlockStatus(sender, 'block');
  }
  messageStore.delete(senderKey);
}
