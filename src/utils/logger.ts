import config from '../../config.ts';
import type { ILogger } from '../@types/logger.ts';

const LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const;

const Level = LEVELS[(config.LOGGER as keyof typeof LEVELS) || 'info'] || 30;

const log = (level: keyof typeof LEVELS, data: unknown, msg?: string) => {
  if (LEVELS[level] < Level) return;

  const entry = msg
    ? { ...(typeof data === 'object' && data !== null ? data : { msg: data }), msg }
    : typeof data === 'object' && data !== null
      ? data
      : { msg: data };

  console.log(JSON.stringify(entry));
};

const logger: ILogger = {
  level: process.env.LOG_LEVEL || 'info',

  trace: (data, msg) => log('trace', data, msg),
  debug: (data, msg) => log('debug', data, msg),
  info: (data, msg) => log('info', data, msg),
  warn: (data, msg) => log('warn', data, msg),
  error: (data, msg) => log('error', data, msg),

  child: (obj: Record<string, unknown>) => {
    const childLog = (level: keyof typeof LEVELS) => (data: unknown, msg?: string) => {
      const mergedData = { ...obj, ...(typeof data === 'object' ? data : {}) };
      const message = typeof data === 'object' ? msg : String(data);
      log(level, mergedData, message);
    };

    return {
      ...logger,
      trace: childLog('trace'),
      debug: childLog('debug'),
      info: childLog('info'),
      warn: childLog('warn'),
      error: childLog('error'),
      child: (newObj) => logger.child({ ...obj, ...newObj }),
    };
  },
};

export default logger;
