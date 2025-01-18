import { getSettings } from '#sql';
import { isJidGroup } from 'baileys';

/**
 * Processes and relays view-once messages, allowing them to be viewed multiple times.
 * 
 * @param {Object} msg - The incoming message object with view-once property.
 * @returns {Promise<void>} A promise that resolves after processing the message.
 * 
 * @description
 * This function handles view-once messages based on configured settings:
 * - Checks if the message has a view-once property
 * - Verifies if the anti-view-once feature is enabled
 * - Validates message type (group or direct message) against settings
 * - Removes view-once restriction and adds context information
 * - Relays the modified message back to the original sender
 * 
 * @throws {Error} Potential errors during settings retrieval or message relay
 */
export async function AntiViewOnce(msg) {
  if (!msg.viewonce) return;

  const settings = await getSettings();
  if (!settings.isEnabled) return;

  const isGroup = isJidGroup(msg.from);
  if (settings.type === 'gc' && !isGroup) return;
  if (settings.type === 'dm' && isGroup) return;

  const modifiedMessage = JSON.parse(JSON.stringify(msg.message));
  const messageType = Object.keys(modifiedMessage)[0];

  if (modifiedMessage[messageType]) {
    delete modifiedMessage[messageType].viewOnce;
    modifiedMessage[messageType].contextInfo = {
      stanzaId: msg.key.id,
      participant: msg.sender,
      quotedMessage: msg.message,
    };
  }

  await msg.client.relayMessage(msg.from, modifiedMessage, {});
}
