import logger from './src/utils/logger.ts';
import { initConnection } from './src/core/connection.ts';
import { syncPlugins } from './src/hooks/api/functions/loader.ts';

(async (): Promise<void> => {
  try {
    await syncPlugins('../../../plugins', '.mts');
    await initConnection();
  } catch (error) {
    logger.error(error);
  }
})();
