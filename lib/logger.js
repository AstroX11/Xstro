/**
 * Disables console logging and overrides logging methods for specified libraries.
 * 
 * @description
 * This function silences console logging by replacing standard console methods
 * with no-op functions. It also attempts to modify logging libraries (currently 'pino')
 * to prevent log output by replacing their logger creation methods with empty loggers.
 * 
 * @example
 * eventlogger(); // Silences all console and pino logging
 * 
 * @returns {void}
 */
export function eventlogger() {
  ['error', 'warn', 'info', 'debug', 'trace'].forEach((method) => {
    console[method] = () => {};
  });

  const loggingLibraries = ['pino'];
  loggingLibraries.forEach((lib) => {
    try {
      const logger = require(lib);
      if (logger && logger.createLogger) {
        logger.createLogger = () => ({
          info: () => {},
          warn: () => {},
          error: () => {},
          debug: () => {},
        });
      }
    } catch {}
  });
}

export const logger = {
  level: 'silent',
  log: () => {},
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  trace: () => {},
  child: () => logger,
};
