import { isJidGroup } from 'baileys';
import { isSudo, getAntiWords, isAntiWordEnabled } from '#sql';

/**
 * Manages anti-word functionality in group chats by detecting and removing messages containing prohibited words.
 * 
 * @param {Object} msg - The message object to be processed.
 * @param {string} msg.from - The chat identifier where the message was sent.
 * @param {string} msg.body - The text content of the message.
 * @param {Object} msg.sender - The sender of the message.
 * @param {boolean} msg.isAdmin - Indicates if the sender is an admin.
 * @param {boolean} msg.isBotAdmin - Indicates if the bot has admin privileges.
 * @param {Object} msg.client - The messaging client instance.
 * @param {Function} msg.send - Method to send messages in the chat.
 * 
 * @returns {Promise<void>} A promise that resolves after processing the message.
 * 
 * @description
 * This function performs the following checks:
 * - Verifies the message is from a group chat
 * - Ensures the message has content and a sender
 * - Skips processing for the bot user, sudo users, and group admins
 * - Checks if anti-word functionality is enabled for the group
 * - Deletes messages containing prohibited words when bot has admin privileges
 * - Notifies the sender about message deletion
 */
export async function AntiWord(msg) {
  if (!isJidGroup(msg.from)) return;
  if (!msg.body || !msg.sender) return;
  if (msg.sender === msg.user || (await isSudo(msg.sender)) || msg.isAdmin) return;
  if (await isAntiWordEnabled(msg.from)) {
    const badwords = await getAntiWords(msg.from);
    if (!badwords) return;

    const un_allowed_words = badwords.words;
    if (un_allowed_words.some((word) => msg.body.toLowerCase().includes(word.toLowerCase()))) {
      if (!msg.isBotAdmin) return;
      await msg.client.sendMessage(msg.from, { delete: msg?.key });
      await msg.send(
        `\`\`\`@${msg.sender.split('@')[0]} your message has been deleted for using a prohibited word.\`\`\``,
        {
          mentions: [msg.sender],
        }
      );
    }
  }
}
