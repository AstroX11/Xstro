import fs from 'fs';
import path from 'path';

const store = path.join('store', 'areact.json');

if (!fs.existsSync(store)) {
  fs.writeFileSync(store, JSON.stringify({ status: false }));
}

const readDB = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeDB = (data) => fs.writeFileSync(store, JSON.stringify(data, null, 2));

/**
 * Sets the auto-react status in the database.
 * @param {boolean} status - The desired auto-react status (true to enable, false to disable).
 * @returns {Object} An object indicating the operation's success and the new status.
 * @property {boolean} success - Indicates whether the status was successfully updated.
 * @property {string} message - A human-readable message describing the new auto-react status.
 */
async function setAutoReactStatus(status) {
  const db = readDB();
  db.status = status;
  writeDB(db);

  return {
    success: true,
    message: `Auto-react is now ${status ? 'enabled' : 'disabled'}`,
  };
}

/**
 * Retrieves the current auto-react status from the JSON database.
 * @returns {boolean} The current auto-react status (true if enabled, false if disabled).
 */
async function getAutoReactStatus() {
  const db = readDB();
  return db.status;
}

export { setAutoReactStatus, getAutoReactStatus };
