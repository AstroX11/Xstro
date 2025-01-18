import fs from 'fs';
import path from 'path';

const store = path.join('store', 'antilink.json');

if (!fs.existsSync(store)) fs.writeFileSync(store, JSON.stringify({}));

const readDB = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeDB = (data) => fs.writeFileSync(store, JSON.stringify(data, null, 2));

/**
 * Set or update the antilink configuration for a group.
 * @param {string} jid - The unique identifier of the group.
 * @param {string} type - The configuration type, such as 'link', 'media', or 'spam'.
 * @param {string} action - The action to take when an antilink violation occurs ('delete', 'kick', 'warn', 'on', 'off').
 * @returns {Promise<boolean>} Indicates whether the configuration was successfully inserted or updated.
 * @description Configures antilink settings for a specific group, allowing customization of how link-related violations are handled.
 * @example
 * // Enable link deletion for a group
 * await setAntilink('group123@g.us', 'link', 'delete')
 * 
 * @throws {Error} If there are issues writing to the configuration file.
 */
async function setAntilink(jid, type, action) {
  const db = readDB();
  const groupConfig = db[jid] || {};

  const existingConfig = groupConfig[type];
  if (existingConfig && existingConfig.action === action) return false;

  if (existingConfig) {
    groupConfig[type] = { action, warningCount: existingConfig.warningCount || 0 };
  } else {
    groupConfig[type] = { action, warningCount: 0 };
  }

  db[jid] = groupConfig;
  writeDB(db);
  return true;
}

/**
 * Retrieves the antilink configuration for a specific group and type.
 * @param {string} jid - The unique identifier of the group.
 * @param {string} type - The specific configuration type to retrieve (e.g., 'on', 'off', 'action').
 * @returns {Promise<object|null>} The configuration object for the specified group and type, or null if no configuration exists.
 * @description Reads the antilink database and returns the configuration for a given group and type. If no configuration is found, returns null.
 */
async function getAntilink(jid, type) {
  const db = readDB();
  const groupConfig = db[jid] || {};
  return groupConfig[type] || null;
}

/**
 * Remove antilink configuration for a specific type in a group.
 * @param {string} jid - The unique identifier of the group.
 * @param {string} type - The specific antilink configuration type to be removed.
 * @returns {Promise<number>} Number of configurations removed (1 if removed, 0 if not found).
 * @throws {Error} If there are issues reading or writing the database file.
 */
async function removeAntilink(jid, type) {
  const db = readDB();
  const groupConfig = db[jid] || {};

  if (groupConfig[type]) {
    delete groupConfig[type];
    db[jid] = groupConfig;
    writeDB(db);
    return 1;
  }

  return 0;
}

/**
 * Save the warning count for a specific configuration type in a group.
 * @param {string} jid - The unique identifier of the group.
 * @param {string} type - The configuration type to update (e.g., 'antilink', 'spam').
 * @param {number} count - The new warning count to set for the specified configuration.
 * @returns {Promise<void>} A promise that resolves after updating the warning count in the database.
 * @description Updates the warning count for a specific group and configuration type. If the group or configuration type does not exist, no action is taken.
 */
async function saveWarningCount(jid, type, count) {
  const db = readDB();
  const groupConfig = db[jid] || {};

  if (groupConfig[type]) {
    groupConfig[type].warningCount = count;
    db[jid] = groupConfig;
    writeDB(db);
  }
}

/**
 * Increments the warning count for a specific group and configuration type.
 * 
 * @param {string} jid - The unique identifier of the group.
 * @param {string} type - The specific configuration type for which the warning count is being incremented.
 * @returns {Promise<number>} The updated warning count after incrementing.
 * 
 * @description
 * This function retrieves the current warning count for a group's specific configuration type,
 * increments it by one, and saves the new count. If no previous warning count exists, it starts from zero.
 * 
 * @example
 * // Increment warning count for a group's link protection configuration
 * const newCount = await incrementWarningCount('group123@g.us', 'link')
 */
async function incrementWarningCount(jid, type) {
  const groupConfig = (readDB()[jid] || {})[type];
  const newCount = (groupConfig?.warningCount || 0) + 1;
  await saveWarningCount(jid, type, newCount);
  return newCount;
}

/**
 * Resets the warning count for a specific group and configuration type to zero.
 * @param {string} jid - The unique identifier of the group.
 * @param {string} type - The type of configuration for which the warning count is being reset.
 * @returns {Promise<void>} A promise that resolves when the warning count has been reset.
 */
async function resetWarningCount(jid, type) {
  await saveWarningCount(jid, type, 0);
}

export {
  setAntilink,
  removeAntilink,
  getAntilink,
  saveWarningCount,
  incrementWarningCount,
  resetWarningCount,
};
