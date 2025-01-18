import fs from 'fs';
import path from 'path';

const store = path.join('store', 'antiword.json');

if (!fs.existsSync(store)) fs.writeFileSync(store, JSON.stringify([]));

const readDB = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeDB = (data) => fs.writeFileSync(store, JSON.stringify(data, null, 2));

/**
 * Sets the antiword status for a specific group.
 * @param {string} jid - The unique Jabber ID of the group.
 * @param {boolean} action - The status to set for antiword functionality (true to enable, false to disable).
 * @returns {Object} An object indicating the result of the operation with a success status and message.
 * @returns {boolean} returns.success - Indicates whether the status was successfully updated.
 * @returns {string} returns.message - A descriptive message about the antiword status change.
 */
async function setAntiWordStatus(jid, action) {
  if (!jid) return;
  const db = readDB();
  let record = db.find((item) => item.jid === jid);

  if (!record) {
    record = { jid, status: action, words: [] };
    db.push(record);
  } else {
    record.status = action;
  }

  writeDB(db);

  return {
    success: true,
    message: `Antiword ${action ? 'enabled' : 'disabled'} for group ${jid}`,
  };
}

/**
 * Adds antiwords to a specific group's record.
 * @param {string} jid - The unique identifier of the group.
 * @param {string[]} words - List of words to add as antiwords.
 * @returns {Object} An object containing the result of the operation with success status, message, and added words.
 * @description Adds new antiwords to a group's record, ensuring no duplicate words are added. Creates a new record if one doesn't exist.
 */
async function addAntiWords(jid, words) {
  if (!jid || !words) return;
  const db = readDB();
  let record = db.find((item) => item.jid === jid);

  if (!record) {
    record = { jid, status: false, words: words };
    db.push(record);
  } else {
    const uniqueWords = [...new Set([...record.words, ...words])];
    record.words = uniqueWords;
  }

  writeDB(db);

  return {
    success: true,
    message: `Added ${words.length} antiwords to group ${jid}`,
    addedWords: words,
  };
}

/**
 * Removes specified antiwords from a group's antiword list.
 * @param {string} jid - The unique identifier of the group.
 * @param {string[]} words - List of words to remove from the antiword list.
 * @returns {Object} An object indicating the result of the removal operation.
 * @returns {boolean} returns.success - Whether the removal was successful.
 * @returns {string} returns.message - A descriptive message about the operation.
 * @returns {string[]} [returns.removedWords] - The words that were attempted to be removed.
 */
async function removeAntiWords(jid, words) {
  if (!jid) return;
  const db = readDB();
  const record = db.find((item) => item.jid === jid);

  if (!record) {
    return {
      success: false,
      message: `No antiwords found for group ${jid}`,
    };
  }

  record.words = record.words.filter((word) => !words.includes(word));
  writeDB(db);

  return {
    success: true,
    message: `Removed ${words.length} antiwords from group ${jid}`,
    removedWords: words,
  };
}

/**
 * Retrieves antiwords configuration for a specific group.
 * @param {string} jid - The Jabber ID of the group.
 * @returns {Object} An object containing antiword configuration details.
 * @returns {boolean} returns.success - Indicates whether the retrieval was successful.
 * @returns {boolean} returns.status - Whether antiword functionality is enabled for the group.
 * @returns {string[]} returns.words - List of antiwords configured for the group.
 */
async function getAntiWords(jid) {
  if (!jid) return;
  const db = readDB();
  const record = db.find((item) => item.jid === jid);

  if (!record) {
    return {
      success: true,
      status: false,
      words: [],
    };
  }

  return {
    success: true,
    status: record.status,
    words: record.words,
  };
}

/**
 * Checks if antiword functionality is enabled for a specific group.
 * @param {string} jid - The Jabber ID of the group to check.
 * @returns {boolean} Whether antiword is enabled for the group. Returns false if no record exists.
 */
async function isAntiWordEnabled(jid) {
  if (!jid) return;
  const db = readDB();
  const record = db.find((item) => item.jid === jid);
  return record ? record.status : false;
}

export { setAntiWordStatus, addAntiWords, removeAntiWords, getAntiWords, isAntiWordEnabled };
