import fs from 'fs';
import path from 'path';

const storePath = path.join('store', 'antidelete.json');

if (!fs.existsSync(storePath)) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify({ antidelete: false }, null, 2));
}

const readDB = () => JSON.parse(fs.readFileSync(storePath, 'utf8'));
const writeDB = (data) => fs.writeFileSync(storePath, JSON.stringify(data, null, 2));

/**
 * Sets the anti-delete status in the configuration file.
 * @param {boolean} status - The anti-delete status to set. Must be a boolean value.
 * @throws {Error} Throws an error if the status is not a boolean.
 */
export function setAntiDelete(status) {
  if (typeof status !== 'boolean') {
    throw new Error('Status must be a boolean.');
  }
  const data = readDB();
  data.antidelete = status;
  writeDB(data);
}

/**
 * Retrieves the current anti-delete status from the configuration file.
 * @returns {boolean} The current anti-delete setting, which determines whether deletion is prevented.
 */
export function getAntiDelete() {
  const data = readDB();
  return data.antidelete;
}
