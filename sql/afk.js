import fs from 'fs';
import path from 'path';

const store = path.join('store', 'afk.json');

/**
 * Retrieves the current Away From Keyboard (AFK) message from a JSON store.
 * 
 * @returns {Object|null} An object containing the AFK message and timestamp, 
 * or null if no valid AFK message is set.
 * @throws {Error} If there are issues reading or parsing the JSON file.
 */
export async function getAfkMessage() {
  if (!fs.existsSync(store))
    fs.writeFileSync(store, JSON.stringify({ message: null, timestamp: null }));
  const data = JSON.parse(fs.readFileSync(store, 'utf8'));
  if (data.message && data.timestamp) {
    return { message: data.message, timestamp: data.timestamp };
  }
  return null;
}

export const setAfkMessage = async (afkMessage, timestamp) => {
  if (!fs.existsSync(store))
    fs.writeFileSync(store, JSON.stringify({ message: null, timestamp: null }));
  const data = { message: afkMessage, timestamp };
  fs.writeFileSync(store, JSON.stringify(data, null, 2));
  return data;
};

export const delAfkMessage = async () => {
  if (!fs.existsSync(store))
    fs.writeFileSync(store, JSON.stringify({ message: null, timestamp: null }));
  const data = { message: null, timestamp: null };
  fs.writeFileSync(store, JSON.stringify(data, null, 2));
};
