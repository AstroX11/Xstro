import {
	makeWASocket,
	makeCacheableSignalKeyStore,
	Browsers,
	fetchLatestBaileysVersion,
} from 'baileys';
import { pino } from 'pino';
import { HttpsProxyAgent } from 'https-proxy-agent';
import NodeCache from '@cacheable/node-cache';

import config from '../../config.mjs';
import emit from './emit.ts';
import bind from './bind.ts';
import useSqliteAuthState from '../utils/useSqliteAuthState.ts';
import { getMessage, cachedGroupMetadata } from '../models/index.ts';

(async () => {
	const { state, saveCreds } = await useSqliteAuthState();
	const { version } = await fetchLatestBaileysVersion();
	const cache = new NodeCache();
	const logger = pino({ level: 'silent' });

	const sock = makeWASocket({
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		agent: config.PROXY ? new HttpsProxyAgent(config.PROXY) : undefined,
		logger,
		version,
		keepAliveIntervalMs: 2000,
		browser: Browsers.windows('chrome'),
		emitOwnEvents: true,
		generateHighQualityLinkPreview: true,
		linkPreviewImageThumbnailWidth: 1920,
		msgRetryCounterCache: cache,
		mediaCache: cache,
		userDevicesCache: cache,
		callOfferCache: cache,
		getMessage,
		cachedGroupMetadata,
	});

	await Promise.all([emit(sock, { saveCreds }), bind(sock)]);
	return sock;
})();
