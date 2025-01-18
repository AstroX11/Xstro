import fs from 'fs';
import path from 'path';
import { isJidGroup } from 'baileys';

const store = path.join('store', 'antispam.json');

if (!fs.existsSync(store)) fs.writeFileSync(store, JSON.stringify({}));

const readDB = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeDB = (data) => fs.writeFileSync(store, JSON.stringify(data, null, 2));

/**
 * Sets the anti-spam mode for a specific group or global context.
 * @param {string} jid - The Jabber ID (JID) of the group or a global context.
 * @param {string} mode - The anti-spam mode to be set (e.g., 'on', 'off').
 * @returns {boolean} Always returns true after successfully updating the anti-spam setting.
 * @description Normalizes the JID to 'global' if it's not a group, updates the anti-spam mode in the JSON database, and persists the changes.
 */
async function setAntiSpam(jid, mode) {
  const normalizedJid = isJidGroup(jid) ? jid : 'global';
  const db = readDB();
  db[normalizedJid] = { mode };
  writeDB(db);
  return true;
}

/**
 * Retrieves the anti-spam mode for a specific JID or global context.
 * @param {string} jid - The Jabber ID (group or global) to check anti-spam settings for.
 * @returns {string} The anti-spam mode, defaulting to 'off' if no setting is found.
 */
async function getAntiSpamMode(jid) {
  const normalizedJid = isJidGroup(jid) ? jid : 'global';
  const db = readDB();
  const setting = db[normalizedJid];
  return setting ? setting.mode : 'off';
}

export { setAntiSpam, getAntiSpamMode };
