import fs from 'fs';
import path from 'path';

const antibotStore = path.join('store', 'antibot.json');

const readDB = () => JSON.parse(fs.readFileSync(antibotStore, 'utf8'));
const writeDB = (data) => fs.writeFileSync(antibotStore, JSON.stringify(data, null, 2));

/**
 * Sets or updates the anti-bot status for a specific user.
 * @param {string} jid - The unique identifier of the user.
 * @param {boolean} enabled - The anti-bot status to set (true or false).
 * @returns {Object} An object containing the user's JID and updated anti-bot status.
 * @description Creates the anti-bot store file if it doesn't exist, then either updates an existing record or adds a new one.
 */
async function setAntibot(jid, enabled) {
  if (!fs.existsSync(antibotStore)) fs.writeFileSync(antibotStore, JSON.stringify([]));
  const data = readDB();
  const existingRecord = data.find((record) => record.jid === jid);

  if (existingRecord) {
    existingRecord.enabled = enabled;
  } else {
    data.push({ jid, enabled });
  }

  writeDB(data);
  return { jid, enabled };
}

/**
 * Deletes an anti-bot record for a specific user ID.
 * @param {string} jid - The user identifier to remove from the anti-bot database.
 * @returns {boolean} Indicates whether a record was successfully deleted (true if a record was removed, false otherwise).
 * @description Removes the specified user's anti-bot record from the JSON database. Creates the database file if it doesn't exist.
 */
async function delAntibot(jid) {
  if (!fs.existsSync(antibotStore)) fs.writeFileSync(antibotStore, JSON.stringify([]));
  const data = readDB();
  const filteredData = data.filter((record) => record.jid !== jid);
  writeDB(filteredData);
  return data.length !== filteredData.length;
}

/**
 * Retrieves the anti-bot status for a specific user ID.
 * @param {string} jid - The user identifier to check anti-bot status for.
 * @returns {boolean} Whether anti-bot is enabled for the specified user ID. Returns false if no record exists.
 */
async function getAntibot(jid) {
  if (!fs.existsSync(antibotStore)) fs.writeFileSync(antibotStore, JSON.stringify([]));
  const data = readDB();
  const record = data.find((record) => record.jid === jid);
  return record ? record.enabled : false;
}

export { setAntibot, delAntibot, getAntibot };
