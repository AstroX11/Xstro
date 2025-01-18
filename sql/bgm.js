import fs from 'fs';
import path from 'path';

const store = path.join('store', 'bgm.json');

if (!fs.existsSync(store)) {
  fs.writeFileSync(store, JSON.stringify([]));
}

const readDB = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeDB = (data) => fs.writeFileSync(store, JSON.stringify(data, null, 2));

/**
 * Adds a new background music (BGM) entry to the database.
 * @param {string} word - The trigger word for the BGM entry, converted to lowercase.
 * @param {string} response - The response or description associated with the BGM entry.
 * @returns {Object} The newly created BGM entry with lowercase word and response.
 * @throws {Error} If word or response is missing, or if an entry with the same word already exists.
 */
async function addBgm(word, response) {
  if (!word || !response) {
    throw new Error('Both word and response are required');
  }

  const bgmList = readDB();
  const existingEntry = bgmList.find((entry) => entry.word === word.toLowerCase());

  if (existingEntry) {
    throw new Error(`BGM entry for word "${word}" already exists`);
  }

  const newEntry = { word: word.toLowerCase(), response };
  bgmList.push(newEntry);
  writeDB(bgmList);

  return newEntry;
}

/**
 * Retrieves the background music (BGM) response for a given word.
 * @param {string} word - The word to search for in the BGM list.
 * @returns {string|null} The BGM response associated with the word, or null if no matching entry is found.
 * @throws {Error} If the word parameter is not provided.
 */
async function getBgmResponse(word) {
  if (!word) {
    throw new Error('Word parameter is required');
  }

  const bgmList = readDB();
  const entry = bgmList.find((item) => item.word === word.toLowerCase());

  return entry ? entry.response : null;
}

/**
 * Deletes a BGM (Background Music) entry from the database by its word.
 * @param {string} word - The word associated with the BGM entry to delete.
 * @returns {boolean} - Returns true if the entry was successfully deleted, false if no matching entry was found.
 * @throws {Error} - Throws an error if no word is provided.
 */
async function deleteBgm(word) {
  if (!word) {
    throw new Error('Word parameter is required');
  }

  const bgmList = readDB();
  const index = bgmList.findIndex((item) => item.word === word.toLowerCase());

  if (index !== -1) {
    bgmList.splice(index, 1);
    writeDB(bgmList);
    return true;
  }

  return false;
}

/**
 * Retrieves and returns a sorted list of all Background Music (BGM) entries.
 * 
 * @returns {Array<Object>} A sorted array of BGM entries, ordered alphabetically by the 'word' property.
 * @throws {Error} If there's an issue reading the BGM database file.
 */
async function getBgmList() {
  const bgmList = readDB();
  return bgmList.sort((a, b) => a.word.localeCompare(b.word));
}

export { addBgm, getBgmResponse, deleteBgm, getBgmList };
