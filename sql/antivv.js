import fs from 'fs';
import path from 'path';

const store = path.join('store', 'antiviewonce.json');

if (!fs.existsSync(store))
  fs.writeFileSync(store, JSON.stringify({ type: 'all', isEnabled: false }));

const readDB = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeDB = (data) => fs.writeFileSync(store, JSON.stringify(data, null, 2));

/**
 * Sets the view once feature's enabled status in the configuration.
 * @param {boolean} status - The desired enabled state of the view once feature.
 * @returns {boolean} Always returns true after updating the configuration.
 */
async function setViewOnce(status) {
  const db = readDB();
  db.isEnabled = status;
  writeDB(db);
  return true;
}

/**
 * Checks if the view once feature is currently enabled.
 * @returns {Promise<boolean>} A promise that resolves to the current enabled status of the view once feature.
 */
async function isViewOnceEnabled() {
  const db = readDB();
  return db.isEnabled;
}

/**
 * Sets the view once type in the configuration file.
 * @param {string} type - The type of view once setting to apply.
 * @returns {boolean} Always returns true after updating the configuration.
 */
async function setViewOnceType(type) {
  const db = readDB();
  db.type = type;
  writeDB(db);
  return true;
}

/**
 * Retrieves the current view once settings from the configuration file.
 * @returns {Object} The complete settings object containing configuration details.
 */
async function getSettings() {
  const db = readDB();
  return db;
}

export { setViewOnce, isViewOnceEnabled, setViewOnceType, getSettings };
