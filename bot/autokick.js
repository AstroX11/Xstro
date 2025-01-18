import { getKicks } from '#sql';
import { isJidGroup } from 'baileys';

const monitoredGroups = new Set();

/**
 * Automatically monitors and kicks participants from a group based on predefined criteria.
 * 
 * @param {Object} msg - The message object containing group and client information.
 * @param {string} msg.from - The group ID to monitor.
 * @param {Object} msg.client - The messaging client with group management methods.
 * 
 * @description
 * This function performs the following actions:
 * - Validates the group ID
 * - Prevents duplicate monitoring of the same group
 * - Periodically checks group participants for kick conditions
 * - Removes participants with detected kick flags
 * 
 * @async
 * @throws {Error} Potential errors during group metadata retrieval or participant update
 * 
 * @example
 * // Automatically monitor and kick participants in a group
 * await AutoKick(messageObject);
 */
export async function AutoKick(msg) {
  const groupId = msg.from;

  if (!isJidGroup(groupId) || monitoredGroups.has(groupId)) return;

  monitoredGroups.add(groupId);

  setInterval(async () => {
    const groupMeta = await msg.client.groupMetadata(groupId);
    const participants = groupMeta.participants.map((p) => p.id);

    for (const wanted of participants) {
      const kicks = await getKicks(groupId, wanted);
      if (kicks.length > 0) {
        await msg.client.sendMessage(groupId, {
          text: `\`\`\`@${wanted.split('@')[0]} is detected from AutoKick, now kicking loser.\`\`\``,
          mentions: [wanted],
        });
        await msg.client.groupParticipantsUpdate(groupId, [wanted], 'remove');
      }
    }
  }, 10000);
}
