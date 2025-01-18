import fs from 'fs';
import path from 'path';

const anticallStore = path.join('store', 'anticall.json');

if (!fs.existsSync(anticallStore)) {
  fs.writeFileSync(
    anticallStore,
    JSON.stringify({ id: 1, on: false, type: 'on', action: 'block', jid: null })
  );
}

const readDB = () => JSON.parse(fs.readFileSync(anticallStore, 'utf8'));
const writeDB = (data) => fs.writeFileSync(anticallStore, JSON.stringify(data, null, 2));

/**
 * Configures anti-call settings to block or reject incoming calls.
 * @param {string} type - The type of anti-call configuration: 'on', 'all', or 'set'.
 * @param {string} [action='block'] - The action to take when a call is blocked: 'block' or 'reject'.
 * @param {string[]|null} [jids=null] - List of country codes or phone numbers based on type.
 * @returns {boolean} Indicates successful configuration of anti-call settings.
 * @throws {Error} If action is invalid or jids do not meet type-specific requirements.
 * @example
 * // Enable anti-call for all calls
 * await addAntiCall('on');
 * 
 * // Block calls from specific country codes
 * await addAntiCall('all', 'block', ['44', '1']);
 * 
 * // Reject calls from specific phone numbers
 * await addAntiCall('set', 'reject', ['14155552671', '18885551234']);
 */
async function addAntiCall(type, action = 'block', jids = null) {
  if (!['block', 'reject'].includes(action)) {
    throw new Error('Action must be either block or reject');
  }

  if (type === 'on') {
    jids = null;
  } else if (type === 'all') {
    if (!Array.isArray(jids) || !jids.every((jid) => jid.length <= 4)) {
      throw new Error('All type requires array of country codes (max 4 chars)');
    }
  } else if (type === 'set') {
    if (!Array.isArray(jids) || !jids.every((jid) => jid.length >= 11)) {
      throw new Error('Set type requires array of full phone numbers (min 11 chars)');
    }
  }

  const record = readDB();
  record.on = true;
  record.type = type;
  record.action = action;
  record.jid = jids;
  writeDB(record);

  return true;
}

/**
 * Disables the anti-call feature by setting its status to off.
 * @returns {boolean} Always returns true after disabling the anti-call feature.
 */
async function delAntiCall() {
  const record = readDB();
  record.on = false;
  writeDB(record);
  return true;
}

/**
 * Retrieves the current anti-call configuration.
 * @returns {Object} The current anti-call settings containing:
 * - {boolean} on - Whether the anti-call feature is enabled
 * - {string} type - The type of anti-call filtering ('on', 'all', or 'set')
 * - {string} action - The action to take when a call is blocked ('block' or 'reject')
 * - {string|null} jid - The specific JIDs or country codes subject to anti-call restrictions
 */
async function getAntiCall() {
  const record = readDB();
  return {
    on: record.on,
    type: record.type,
    action: record.action,
    jid: record.jid,
  };
}

/**
 * Edits the specific anti-call settings by updating type, action, and JIDs.
 * @param {string} type - The anti-call type: 'on', 'all', or 'set'.
 * @param {string} [action='block'] - The action to take: 'block' or 'reject'.
 * @param {string[]} [newJids=[]] - New JIDs to add to the anti-call list.
 * @param {string[]} [removeJids=[]] - JIDs to remove from the anti-call list.
 * @returns {boolean} Indicates successful update of anti-call settings.
 * @throws {Error} If JIDs do not meet type-specific validation requirements.
 */
async function editSpecificAntiCall(type, action, newJids, removeJids = []) {
  const record = readDB();

  let currentJids = record.jid || [];

  if (type) record.type = type;
  if (action) record.action = action;

  if (Array.isArray(newJids)) {
    if (type === 'all' && !newJids.every((jid) => jid.length <= 4)) {
      throw new Error('All type requires country codes (max 4 chars)');
    }
    if (type === 'set' && !newJids.every((jid) => jid.length >= 11)) {
      throw new Error('Set type requires full numbers (min 11 chars)');
    }
    currentJids = [...new Set([...currentJids, ...newJids])];
  }

  if (Array.isArray(removeJids)) {
    currentJids = currentJids.filter((jid) => !removeJids.includes(jid));
  }

  record.jid = type === 'on' ? null : currentJids;
  writeDB(record);

  return true;
}

/**
 * Checks if a given JID (Jabber ID) is subject to anti-call restrictions.
 * @param {string} jid - The Jabber ID to check against anti-call settings.
 * @returns {boolean} Whether the JID is blocked by anti-call settings.
 * @description
 * Determines if a JID is blocked based on the current anti-call configuration:
 * - Returns false if anti-call feature is disabled
 * - Returns true if anti-call is set to 'on' for all calls
 * - For 'all' type, checks if the JID's country code matches any in the list
 * - For 'set' type, checks if the full JID is in the blocked list
 */
async function isJidInAntiCall(jid) {
  const record = readDB();
  if (!record.on) return false;

  if (record.type === 'on') return true;

  if (record.type === 'all') {
    const countryCode = jid.slice(0, Math.min(jid.length, 4));
    return Array.isArray(record.jid) && record.jid.includes(countryCode);
  }

  if (record.type === 'set') {
    return Array.isArray(record.jid) && record.jid.includes(jid);
  }

  return false;
}

export { addAntiCall, delAntiCall, getAntiCall, editSpecificAntiCall, isJidInAntiCall };
