import { pathToFileURL } from 'url';
import { join, extname } from 'path';
import { readdir } from 'fs/promises';

/**
 * Loads JavaScript plugin files from the 'plugins' directory.
 * 
 * @async
 * @description Reads all JavaScript files in the 'plugins' directory and attempts to dynamically import them.
 * Logs an error message for any files that fail to import, and confirms successful plugin synchronization.
 * 
 * @returns {Promise<void>} A promise that resolves after attempting to import all plugin files.
 * 
 * @throws {Error} Logs import errors for individual plugin files without stopping the entire import process.
 * 
 * @example
 * // Automatically imports all .js files from the 'plugins' directory
 * await loadPlugins();
 */
export async function loadPlugins() {
  const pluginsDir = join('plugins');

  const files = await readdir(pluginsDir, { withFileTypes: true });
  await Promise.all(
    files.map(async (file) => {
      const fullPath = join(pluginsDir, file.name);
      if (extname(file.name) === '.js') {
        try {
          const fileUrl = pathToFileURL(fullPath).href;
          await import(fileUrl);
        } catch (err) {
          console.log('ERROR', `${file.name}: ${err.message}`);
        }
      }
    })
  );
  return console.log('Plugins Synced');
}
