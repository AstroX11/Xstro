import fs from 'fs';
import path from 'path';

const store = path.join('store', 'plugins.json');

if (!fs.existsSync(store)) {
  fs.writeFileSync(store, JSON.stringify([], null, 2));
}

const readPlugins = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writePlugins = (plugins) => fs.writeFileSync(store, JSON.stringify(plugins, null, 2));

/**
 * Adds a new plugin to the plugins storage.
 * @param {string} name - The unique name of the plugin to be added.
 * @returns {Promise<Object>} A new plugin object with the specified name.
 * @throws {Error} If a plugin with the same name already exists.
 * @example
 * // Add a new plugin
 * const plugin = await addPlugin('my-awesome-plugin');
 * // plugin will be { name: 'my-awesome-plugin' }
 */
export async function addPlugin(name) {
  const plugins = readPlugins();
  const newPlugin = { name };

  // Check if plugin already exists
  if (plugins.some((plugin) => plugin.name === name)) {
    throw new Error('Plugin already exists');
  }

  plugins.push(newPlugin);
  writePlugins(plugins);
  return newPlugin;
}

/**
 * Updates an existing plugin's name in the plugins store.
 * @param {string} name - The current name of the plugin to be updated.
 * @param {string} newName - The new name to assign to the plugin.
 * @returns {Promise<Object>} The plugin object with the updated name.
 * @throws {Error} Throws an error if the plugin with the specified name cannot be found.
 * @example
 * // Update a plugin named 'oldPlugin' to 'newPlugin'
 * const updatedPlugin = await updatePlugin('oldPlugin', 'newPlugin');
 */
export async function updatePlugin(name, newName) {
  const plugins = readPlugins();
  const pluginIndex = plugins.findIndex((plugin) => plugin.name === name);

  if (pluginIndex === -1) {
    throw new Error('Plugin not found');
  }

  plugins[pluginIndex].name = newName;
  writePlugins(plugins);
  return plugins[pluginIndex];
}

/**
 * Removes a plugin from the plugins storage by its name.
 * @param {string} name - The unique name of the plugin to be removed.
 * @returns {Promise<boolean>} Indicates whether the plugin was successfully removed.
 * @throws {Error} If an issue occurs during plugin removal process.
 */
export async function removePlugin(name) {
  const plugins = readPlugins();
  const pluginIndex = plugins.findIndex((plugin) => plugin.name === name);

  if (pluginIndex === -1) {
    return false;
  }

  plugins.splice(pluginIndex, 1);
  writePlugins(plugins);
  return true;
}

/**
 * Retrieves all plugins from the JSON storage.
 * @returns {Promise<Array>} An array containing all stored plugins.
 * @throws {Error} If there is an issue reading the plugins file.
 */
export async function getPlugins() {
  return readPlugins();
}
