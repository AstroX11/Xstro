import { config } from 'dotenv';
import type { AppConfig } from './src/types/index.ts';

config();

export default {
 SESSION: process.env.SESSION ?? 'XSTRO_69B5_364D_E88F',
 DATABASE: process.env.DATABASE ?? 'database.db',
 PROXY_URI: process.env.PROXY_URI ?? '',
 DEV_MODE: Boolean(process.env.DEV_MODE ?? false),
 LOGGER: process.env.LOG_LEVEL ?? 'info',
 PROCESS_NAME: process.env.PROCESS_NAME ?? 'xstro',
} as AppConfig;
