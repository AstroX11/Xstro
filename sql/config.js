import fs from 'fs';
import path from 'path';

const store = path.join('store', 'config.json');

if (!fs.existsSync(store)) {
  fs.writeFileSync(
    store,
    JSON.stringify(
      {
        autoRead: false,
        autoStatusRead: false,
        cmdReact: true,
        cmdRead: false,
        mode: false,
        PREFIX: '.',
        disabledCmds: [],
        autolikestatus: false,
        disablegc: false,
        disabledm: false,
      },
      null,
      2
    )
  );
}

const readConfig = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeConfig = (config) => fs.writeFileSync(store, JSON.stringify(config, null, 2));

/**
 * Ensures the configuration file exists, creating it with default settings if not.
 * 
 * @returns {Object} The configuration object, either read from the existing file or newly created.
 * @description Checks if a configuration file exists. If not, creates a new configuration 
 * with default settings for various application parameters such as auto-reading, 
 * command reactions, prefix, and disabled commands.
 * 
 * @example
 * // Returns configuration object with default or existing settings
 * const config = await ensureConfigExists();
 */
async function ensureConfigExists() {
  let config = readConfig();
  if (!config) {
    config = {
      autoRead: false,
      autoStatusRead: false,
      cmdReact: true,
      cmdRead: false,
      mode: false,
      PREFIX: '.',
      disabledCmds: [],
      autolikestatus: false,
      disablegc: false,
      disabledm: false,
    };
    writeConfig(config);
  }
  return config;
}

/**
 * Updates a specific configuration field in the configuration file.
 * 
 * @param {string} field - The configuration field to update.
 * @param {(boolean|string|string[])} value - The new value for the configuration field.
 * @returns {Object} The updated configuration object.
 * 
 * @description
 * This function allows updating different configuration settings:
 * - For 'disabledCmds', it merges new commands with existing ones, ensuring uniqueness.
 * - For boolean fields, it converts the value to a boolean.
 * - For 'PREFIX', it preserves the exact string value.
 * 
 * @example
 * // Update autoRead to true
 * await updateConfig('autoRead', true);
 * 
 * @example
 * // Add new disabled commands
 * await updateConfig('disabledCmds', ['ping', 'help']);
 */
async function updateConfig(field, value) {
  let config = await ensureConfigExists();

  if (field === 'disabledCmds' && Array.isArray(value)) {
    const currentCmds = config.disabledCmds || [];
    const newCmds = [...new Set([...currentCmds, ...value])];
    config.disabledCmds = newCmds;
    writeConfig(config);
  } else {
    const updatedValue = field === 'PREFIX' ? value : !!value;
    config[field] = updatedValue;
    writeConfig(config);
  }

  return config;
}

/**
 * Retrieves the current configuration settings.
 * 
 * @async
 * @returns {Object} A subset of configuration properties including:
 * - `autoRead`: Boolean flag for automatic reading
 * - `autoStatusRead`: Boolean flag for automatic status reading
 * - `cmdReact`: Boolean flag for command reactions
 * - `cmdRead`: Boolean flag for command reading
 * - `mode`: Current operational mode
 * - `PREFIX`: Command prefix
 * - `disabledCmds`: Array of disabled commands (defaults to empty array)
 * - `autolikestatus`: Boolean flag for automatic status liking
 * - `disablegc`: Boolean flag to disable group chat functionality
 * - `disabledm`: Boolean flag to disable direct messaging
 * 
 * @throws {Error} If configuration cannot be read or initialized
 */
async function getConfig() {
  const config = await ensureConfigExists();
  return {
    autoRead: config.autoRead,
    autoStatusRead: config.autoStatusRead,
    cmdReact: config.cmdReact,
    cmdRead: config.cmdRead,
    mode: config.mode,
    PREFIX: config.PREFIX,
    disabledCmds: config.disabledCmds || [],
    autolikestatus: config.autolikestatus,
    disablegc: config.disablegc,
    disabledm: config.disabledm,
  };
}

/**
 * Adds a command to the list of disabled commands in the configuration.
 * @async
 * @param {string} cmd - The command to be disabled.
 * @returns {Object} An object indicating the result of the operation:
 *  - `success`: Boolean indicating whether the command was successfully disabled
 *  - `message`: A descriptive message about the operation's outcome
 * @throws {Error} If there are issues reading or writing the configuration file
 */
async function addDisabledCmd(cmd) {
  let config = await ensureConfigExists();
  const currentCmds = config.disabledCmds || [];

  if (currentCmds.includes(cmd)) {
    return { success: false, message: '_Command already disabled._' };
  }

  currentCmds.push(cmd);
  config.disabledCmds = currentCmds;
  writeConfig(config);
  return { success: true, message: `_${cmd} command disabled_` };
}

/**
 * Removes a command from the list of disabled commands.
 * @async
 * @param {string} cmd - The command to be re-enabled.
 * @returns {Promise<Object>} An object indicating the result of the operation.
 * @returns {boolean} returns.success - Indicates whether the command was successfully enabled.
 * @returns {string} returns.message - A descriptive message about the operation's outcome.
 * @throws {Error} Throws an error if there are issues reading or writing the configuration.
 */
async function removeDisabledCmd(cmd) {
  let config = await ensureConfigExists();
  const currentCmds = config.disabledCmds || [];

  if (!currentCmds.includes(cmd)) {
    return { success: false, message: '_Command is not disabled._' };
  }

  const updatedCmds = currentCmds.filter((disabledCmd) => disabledCmd !== cmd);
  config.disabledCmds = updatedCmds;
  writeConfig(config);
  return { success: true, message: `_${cmd} command enabled_` };
}

/**
 * Checks if a specific command is currently disabled.
 * @param {string} cmd - The command to check for disabled status.
 * @returns {Promise<boolean>} True if the command is disabled, false otherwise.
 */
async function isCmdDisabled(cmd) {
  const config = await ensureConfigExists();
  const currentCmds = config.disabledCmds || [];
  return currentCmds.includes(cmd);
}

export { updateConfig, getConfig, addDisabledCmd, removeDisabledCmd, isCmdDisabled };
