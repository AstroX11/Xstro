import fs from 'fs';
import path from 'path';

const store = path.join('store', 'greetings.json');

if (!fs.existsSync(store)) {
  fs.writeFileSync(store, JSON.stringify([], null, 2));
}

const readGreetings = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeGreetings = (greetings) => fs.writeFileSync(store, JSON.stringify(greetings, null, 2));

/**
 * Adds or updates a welcome greeting for a specific chat or user.
 * @param {string} jid - The unique identifier for the chat or user.
 * @param {boolean} action - Whether the welcome greeting is enabled (true) or disabled (false).
 * @param {string|object|null} message - The welcome message to be displayed. Can be a string, JSON object, or null.
 * @throws {Error} If file writing fails during greeting update.
 * @example
 * // Enable welcome message for a group
 * await addWelcome('group123@chat.whatsapp.com', true, 'Welcome to the group!')
 * 
 * // Disable welcome message
 * await addWelcome('group123@chat.whatsapp.com', false, null)
 */
export async function addWelcome(jid, action, message) {
  const greetings = readGreetings();
  const existingWelcome = greetings.find(
    (greeting) => greeting.jid === jid && greeting.type === 'welcome'
  );

  if (existingWelcome) {
    existingWelcome.action = action;
    existingWelcome.message = message;
  } else {
    greetings.push({ jid, type: 'welcome', action, message });
  }

  writeGreetings(greetings);
}

/**
 * Adds or updates a goodbye greeting for a specific chat or user.
 * @param {string} jid - The unique identifier for the chat or user.
 * @param {boolean} action - Whether the goodbye greeting is enabled (true) or disabled (false).
 * @param {string|object|null} message - The goodbye message to be displayed. Can be a string, JSON object, or null.
 * @throws {Error} If file writing fails during greeting update.
 * @example
 * // Enable goodbye greeting with a simple message
 * await addGoodbye('user123@example.com', true, 'See you later!')
 * 
 * // Disable goodbye greeting
 * await addGoodbye('user123@example.com', false, null)
 */
export async function addGoodbye(jid, action, message) {
  const greetings = readGreetings();
  const existingGoodbye = greetings.find(
    (greeting) => greeting.jid === jid && greeting.type === 'goodbye'
  );

  if (existingGoodbye) {
    existingGoodbye.action = action;
    existingGoodbye.message = message;
  } else {
    greetings.push({ jid, type: 'goodbye', action, message });
  }

  writeGreetings(greetings);
}

/**
 * Retrieves the welcome greeting configuration for a specific chat or user.
 * @param {string} jid - The unique identifier (chat ID or JID) to retrieve welcome greeting for.
 * @returns {Promise<{action: boolean, message: string|null}>} An object containing the welcome greeting status and message.
 * @description Searches the greetings configuration for a matching JID and welcome type, returning the greeting details or default values if not found.
 */
export async function getWelcome(jid) {
  const greetings = readGreetings();
  const data = greetings.find((greeting) => greeting.jid === jid && greeting.type === 'welcome');
  return data ? { action: data.action, message: data.message } : { action: false, message: null };
}

/**
 * Retrieves the configured goodbye greeting for a specific chat or user.
 * @param {string} jid - The unique identifier (chat ID or JID) to retrieve the goodbye greeting for.
 * @returns {Promise<{action: boolean, message: string|null}>} An object containing the goodbye greeting status and message, defaulting to disabled and null if no greeting is configured.
 * @description Searches the greetings configuration for a matching JID and goodbye type, returning the associated action and message.
 */
export async function getGoodbye(jid) {
  const greetings = readGreetings();
  const data = greetings.find((greeting) => greeting.jid === jid && greeting.type === 'goodbye');
  return data ? { action: data.action, message: data.message } : { action: false, message: null };
}

/**
 * Checks if the welcome greeting is enabled for a specific JID.
 * @param {string} jid - The unique identifier (chat ID or JID) to check welcome greeting status.
 * @returns {Promise<boolean>} A promise that resolves to true if welcome greeting is enabled, false otherwise.
 * @description Searches through stored greetings to determine if a welcome greeting is active for the given JID.
 * If no matching greeting is found, returns false by default.
 */
export async function isWelcomeOn(jid) {
  const greetings = readGreetings();
  const data = greetings.find((greeting) => greeting.jid === jid && greeting.type === 'welcome');
  return data ? data.action : false;
}

The existing docstring for the `isGoodByeOn` function is already well-structured and follows the JSDocs conventions. It provides a clear description, specifies the parameter type and purpose, and indicates the return type and meaning. Therefore:

KEEP_EXISTING
export async function isGoodByeOn(jid) {
  const greetings = readGreetings();
  const data = greetings.find((greeting) => greeting.jid === jid && greeting.type === 'goodbye');
  return data ? data.action : false;
}

/**
 * Deletes the welcome greeting for a specified JID and sets a default disabled state.
 * 
 * @param {string} jid - The unique identifier (chat ID or JID) for which the welcome greeting will be deleted.
 * @description Removes any existing welcome greeting for the given JID and adds a new entry with the welcome greeting disabled.
 * @example
 * // Deletes welcome greeting for a specific chat
 * await delWelcome('user123@example.com');
 */
export async function delWelcome(jid) {
  const greetings = readGreetings();
  const index = greetings.findIndex(
    (greeting) => greeting.jid === jid && greeting.type === 'welcome'
  );

  if (index !== -1) {
    greetings.splice(index, 1);
  }

  greetings.push({ jid, type: 'welcome', action: false, message: null });
  writeGreetings(greetings);
}

/**
 * Deletes the goodbye greeting for a specified JID.
 * 
 * @param {string} jid - The unique identifier (chat ID or JID) for which the goodbye greeting will be deleted.
 * @description Removes any existing goodbye greeting for the given JID and replaces it with a default disabled greeting.
 * 
 * @example
 * // Delete goodbye greeting for a specific chat
 * await delGoodBye('user123@example.com');
 * 
 * @throws {Error} Potential errors during file reading or writing operations.
 */
export async function delGoodBye(jid) {
  const greetings = readGreetings();
  const index = greetings.findIndex(
    (greeting) => greeting.jid === jid && greeting.type === 'goodbye'
  );

  if (index !== -1) {
    greetings.splice(index, 1);
  }

  greetings.push({ jid, type: 'goodbye', action: false, message: null });
  writeGreetings(greetings);
}
