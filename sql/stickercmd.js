import fs from 'fs';
import path from 'path';

const store = path.join('store', 'stickercmd.json');

if (!fs.existsSync(store)) {
  fs.writeFileSync(store, JSON.stringify([], null, 2));
}

const readStickerCmds = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeStickerCmds = (cmds) => fs.writeFileSync(store, JSON.stringify(cmds, null, 2));

/**
 * Adds or updates a sticker command in the sticker command storage.
 * 
 * @param {string} cmd - The name of the sticker command to add or update.
 * @param {string} id - The unique identifier associated with the sticker command.
 * @returns {Promise<boolean>} Indicates whether the command was successfully added or updated.
 * 
 * @description
 * This function manages sticker commands by either:
 * - Updating the ID of an existing command if the command already exists
 * - Adding a new command with the provided command name and ID
 * 
 * @example
 * // Add a new sticker command
 * await setcmd('hello', 'sticker123')
 * 
 * @example
 * // Update an existing sticker command's ID
 * await setcmd('hello', 'newSticker456')
 */
export async function setcmd(cmd, id) {
  const cmds = readStickerCmds();
  const existingCmd = cmds.find((stickerCmd) => stickerCmd.cmd === cmd);

  if (existingCmd) {
    existingCmd.id = id;
  } else {
    // Add new command
    cmds.push({ cmd, id });
  }

  writeStickerCmds(cmds);
  return true;
}

/**
 * Deletes a specific sticker command from the stored commands.
 * 
 * @param {string} cmd - The name of the sticker command to delete.
 * @returns {Promise<boolean>} Indicates whether the command was successfully deleted.
 * @throws {Error} If there are issues reading or writing the sticker commands file.
 * 
 * @example
 * // Delete a sticker command named 'hello'
 * const deleted = await delcmd('hello');
 * console.log(deleted); // true if deleted, false if not found
 */
export async function delcmd(cmd) {
  const cmds = readStickerCmds();
  const index = cmds.findIndex((stickerCmd) => stickerCmd.cmd === cmd);

  if (index === -1) {
    return false;
  }

  cmds.splice(index, 1);
  writeStickerCmds(cmds);
  return true;
}

/**
 * Retrieves all sticker commands from the JSON storage.
 * @returns {Promise<Array>} An array containing all stored sticker commands. Returns an empty array if no commands exist.
 * @throws {Error} Throws an error if there's an issue reading the sticker commands file.
 */
export async function getcmd() {
  return readStickerCmds();
}

/**
 * Checks if a specific sticker command exists by its unique identifier.
 * 
 * @param {string} id - The unique identifier of the sticker command to search for.
 * @returns {Promise<Object>} An object indicating whether the sticker command exists:
 *  - `exists`: A boolean flag indicating the presence of the command
 *  - `command`: The command details if found, or null if not found
 * 
 * @example
 * // Returns { exists: true, command: { cmd: 'hello', id: '123' } }
 * await isStickerCmd('123')
 * 
 * @example
 * // Returns { exists: false, command: null }
 * await isStickerCmd('nonexistent')
 */
export async function isStickerCmd(id) {
  const cmds = readStickerCmds();
  const stickerCmd = cmds.find((stickerCmd) => stickerCmd.id === id);

  if (stickerCmd) {
    return {
      exists: true,
      command: {
        cmd: stickerCmd.cmd,
        id: stickerCmd.id,
      },
    };
  }

  return {
    exists: false,
    command: null,
  };
}
