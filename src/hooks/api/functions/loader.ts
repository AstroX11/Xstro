import { pathToFileURL, fileURLToPath } from 'url';
import { join, extname, dirname } from 'path';
import { readdir } from 'fs/promises';
import logger from '../../../utils/logger.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function syncPlugins(plugin: string, extensions?: string): Promise<void> {
  if (!extensions) extensions = '.ts';
  const plugins = join(__dirname, plugin);

  const files = await readdir(plugins, { withFileTypes: true });
  await Promise.all(
    files.map(async (file) => {
      const fullPath: string = join(plugins, file.name);
      if (extname(file.name) === extensions) {
        try {
          const fileUrl: string = pathToFileURL(fullPath).href;
          await import(fileUrl);
        } catch (err) {
          logger.error('ERROR', `${file.name}: ${(err as Error).message}`);
        }
      }
    }),
  );
  logger.info('Synced Plugins');
}
