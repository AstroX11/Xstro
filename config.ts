import { config } from 'dotenv';
import type { AppConfig } from './src/types/bot.ts';

config();

export default {
 SESSION: process.env.SESSION ?? '',
 DATABASE: process.env.DATABASE ?? 'database.db',
 PROXY_URI: process.env.PROXY_URI ?? '',
 LOGGER: process.env.LOG_LEVEL ?? 'info',
 PROCESS_NAME: process.env.PROCESS_NAME ?? 'xstro',
 DEBUG: process.env.DEBUG ?? 0,
} as AppConfig;
