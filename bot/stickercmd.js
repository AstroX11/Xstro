import { commands } from '#lib';
import { isStickerCmd } from '#sql';
import Message from '../lib/class.js';

/**
 * Processes sticker messages and executes corresponding commands.
 * 
 * @param {Object} msg - The incoming message object.
 * @param {string} msg.type - The type of message, expected to be 'stickerMessage'.
 * @param {Object} msg.message - The message content containing sticker information.
 * @param {Object} msg.message.stickerMessage - Details about the sticker.
 * @param {Buffer} msg.message.stickerMessage.fileSha256 - SHA256 hash of the sticker file.
 * @param {Object} msg.client - The client instance associated with the message.
 * @param {string} [msg.body] - Optional message body.
 * 
 * @returns {Promise<void>}
 * 
 * @description Checks if a received sticker matches a predefined command. If a matching command is found,
 * it executes the corresponding command function with the message instance.
 */
export async function StickerCMD(msg) {
  if (msg.type === 'stickerMessage') {
    const data = await isStickerCmd(
      Buffer.from(msg.message.stickerMessage.fileSha256).toString('hex')
    );
    const inst = new Message(msg.client, msg);
    if (!data.exists) return;

    for (const command of commands) {
      const commandName = command.pattern.toString().split(/\W+/)[2];
      if (commandName === data.command.cmd) {
        await command.function(inst, msg.body);
        break;
      }
    }
  }
}
