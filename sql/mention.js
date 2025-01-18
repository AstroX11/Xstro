import fs from 'fs';
import path from 'path';

const store = path.join('store', 'mentions.json');

if (!fs.existsSync(store)) {
  fs.writeFileSync(store, JSON.stringify([], null, 2));
}

const readMentions = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeMentions = (mentions) => fs.writeFileSync(store, JSON.stringify(mentions, null, 2));

/**
 * Sets or updates a mention for a specific JID in the mentions storage.
 * @param {string} jid - The unique identifier (chat ID or JID) to associate with the mention.
 * @param {Object} message - The message object to be stored for the given JID.
 * @returns {Promise<boolean>} Indicates whether the mention was successfully set or updated.
 * @description Adds a new mention or updates an existing mention in the JSON storage. 
 * If a mention for the JID already exists, its message is replaced. If no mention exists, 
 * a new mention is created. The changes are immediately written to the mentions.json file.
 */
export async function setMention(jid, message) {
  const mentions = readMentions();
  const existingMention = mentions.find((mention) => mention.jid === jid);

  if (existingMention) {
    existingMention.message = message;
  } else {
    mentions.push({ jid, message });
  }

  writeMentions(mentions);
  return true;
}

/**
 * Deletes a mention associated with a specific JID from the mentions storage.
 * 
 * @param {string} jid - The unique identifier (chat ID or JID) for which the mention should be deleted.
 * @returns {Promise<boolean>} Indicates whether the mention was successfully deleted:
 *  - `true` if a mention was found and removed
 *  - `false` if no matching mention was found
 * 
 * @example
 * // Delete a mention for a specific JID
 * const deleted = await delMention('user123@example.com');
 * console.log(deleted); // true or false
 */
export async function delMention(jid) {
  const mentions = readMentions();
  const updatedMentions = mentions.filter((mention) => mention.jid !== jid);

  if (mentions.length !== updatedMentions.length) {
    writeMentions(updatedMentions);
    return true;
  }

  return false;
}

/**
 * Checks if a mention exists for a specific JID.
 * @param {string} jid - The unique identifier (chat ID or JID).
 * @returns {Promise<boolean>} - Returns true if a mention exists, false otherwise.
 */
export async function isMention(jid) {
  const mentions = readMentions();
  return mentions.some((mention) => mention.jid === jid);
}

/**
 * Retrieves the mention message associated with a specific JID.
 * @param {string} jid - The unique identifier (chat ID or JID) to search for.
 * @returns {Promise<Object|null>} A promise that resolves to the message object if a mention exists for the given JID, or null if no mention is found.
 * @async
 * @example
 * // Retrieve a mention for a specific JID
 * const message = await getMention('user123@example.com');
 * if (message) {
 *   console.log('Mention found:', message);
 * } else {
 *   console.log('No mention exists for this JID');
 * }
 */
export async function getMention(jid) {
  const mentions = readMentions();
  const mention = mentions.find((mention) => mention.jid === jid);
  return mention ? mention.message : null;
}
