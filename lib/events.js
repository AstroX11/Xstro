import {
  Antilink,
  AntiSpammer,
  AntiViewOnce,
  AntiWord,
  AutoKick,
  schedules,
  updateGroupMetadata,
  StickerCMD,
} from '#bot';
import { config } from '#config';
import { readFile } from 'fs/promises';
import { getConfig } from '#sql';
import { getJson } from 'xstro-utils';
import { isJidGroup } from 'baileys';

/**
 * Retrieves configuration values from the database.
 * 
 * @async
 * @returns {Promise<Object>} An object containing various configuration settings for the bot.
 * @property {boolean} autoRead - Indicates whether automatic message reading is enabled.
 * @property {boolean} autoStatusRead - Indicates whether automatic status reading is enabled.
 * @property {boolean} cmdReact - Indicates whether command reactions are enabled.
 * @property {boolean} cmdRead - Indicates whether command reading is enabled.
 * @property {string} mode - The current operational mode of the bot.
 * @property {string} PREFIX - The command prefix used for bot interactions.
 * @property {boolean} autolikestatus - Indicates whether automatic status liking is enabled.
 * @property {boolean} disablegc - Indicates whether group chat functionality is disabled.
 * @property {boolean} disabledm - Indicates whether direct messaging is disabled.
 */
export async function getConfigValues() {
  const db_list = await getConfig();
  const {
    autoRead,
    autoStatusRead,
    cmdReact,
    cmdRead,
    mode,
    PREFIX,
    autolikestatus,
    disablegc,
    disabledm,
  } = db_list;
  return {
    autoRead,
    autoStatusRead,
    cmdReact,
    cmdRead,
    mode,
    PREFIX,
    autolikestatus,
    disablegc,
    disabledm,
  };
}

/**
 * Retrieves user data from a specified API endpoint.
 * @async
 * @returns {Promise<Array>} A list of user data fetched from the configured API.
 * @throws {Error} Throws an error if the API request fails or network issues occur.
 */
export async function getUsers() {
  return await getJson(`${config.API_ID}/api/users`);
}

/**
 * Processes incoming messages with various bot tasks and configurations.
 * @param {Object} msg - The incoming message object.
 * @returns {Promise<void>} A promise that resolves when all message processing tasks are complete.
 * @description Handles message processing for both group and non-group messages, applying anti-spam, 
 * sticker commands, group management, and other configurable bot functionalities.
 * @async
 */
export async function upserts(msg) {
  let tasks = [];
  const configValues = await getConfigValues();
  if (!msg.isGroup) {
    if (configValues.disabledm && msg.from !== msg.user) return; // Ignore if disabledm is true and not the user
    tasks.push(AntiSpammer(msg), AntiViewOnce(msg), updateGroupMetadata(msg), StickerCMD(msg));
  }
  if (msg.isGroup) {
    if (isJidGroup(msg.from) && configValues.disablegc) return; // Ignore if disablegc is true in a group
    tasks.push(Antilink(msg), schedules(msg), AntiWord(msg), AutoKick(msg));
  }
  await Promise.all(tasks);
}

export const logo = await readFile('./media/xstro.jpg');
