import {
  makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  Browsers,
} from 'baileys';
import config from '../../config.ts';
import logger from '../utils/logger.ts';
import MakeListeners from '../hooks/api/listeners.ts';
import { getMessage } from '../models/store.ts';
import { cachedGroupMetadata } from '../models/group.ts';
import { connectProxy } from '../hooks/proxy.ts';

export const initConnection = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: config.DEV_MODE,
    agent: config.PROXY_URI ? connectProxy(config.PROXY_URI) : undefined,
    logger,
    browser: Browsers.windows('Chrome'),
    emitOwnEvents: true,
    getMessage,
    cachedGroupMetadata,
  });
  return await new MakeListeners(sock, { saveCreds }).manageProcesses();
};
