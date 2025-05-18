import {
	Browsers,
	DisconnectReason,
	makeCacheableSignalKeyStore,
	makeWASocket,
} from 'baileys';
import { pino } from 'pino';
import { Boom } from '@hapi/boom';

import config from '../../config.mjs';
import lang from '../utils/lang.ts';
import useSqliteAuthState from '../utils/useSqliteAuthState.ts';
import { print } from '../utils/constants.ts';

(async () => {
	// Check if the user inputs a phone number, if there's no number, warn them
	if (!config.USER_NUMBER) {
		return print.fail('NO PHONE NUMBER FOUND IN VAR.');
	}

	// Warp our pairing in a promise
	return new Promise(async (resolve, reject) => {
		try {
			const logger = pino({ level: 'silent' });
			const { state, saveCreds } = await useSqliteAuthState();

			const conn = makeWASocket({
				auth: {
					creds: state.creds,
					keys: makeCacheableSignalKeyStore(state.keys, logger),
				},
				browser: Browsers.windows('chrome'),
			});

			if (!conn.authState.creds.registered) {
				// remove any special characters and extract only numbers
				// We must ensure that the number isn't less than 11 characters in length
				let phoneNumber = config.USER_NUMBER?.replace(/[^0-9]/g, '') ?? '';
				if (phoneNumber.length < 11) {
					print.fail('Input a vaild number');
					process.exit(1);
					return reject(new Error('invaild whatsapp number'));
				}

				setTimeout(async () => {
					let code = await conn.requestPairingCode(phoneNumber);
					print.succeed(`PAIRING CODE: ${code}`);
					resolve(code);
				}, 3000);
			}

			conn.ev.on('creds.update', saveCreds);

			conn.ev.on('connection.update', async update => {
				const { connection, lastDisconnect } = update;

				if (connection === 'open') {
					if (conn.user?.id) {
						await conn.sendMessage(conn.user.id, {
							text: lang.SESSION_INFO,
						});
						process.exit(1);
					}
				}

				if (connection === 'close') {
					const reason = new Boom(lastDisconnect?.error)?.output.statusCode;

					const resetReasons = [
						DisconnectReason.connectionClosed,
						DisconnectReason.connectionLost,
						DisconnectReason.timedOut,
						DisconnectReason.connectionReplaced,
					];

					const resetWithClearStateReasons = [
						DisconnectReason.loggedOut,
						DisconnectReason.badSession,
					];

					if (resetReasons.includes(reason)) {
						process.exit();
					} else if (resetWithClearStateReasons.includes(reason)) {
						process.exit();
					} else if (reason === DisconnectReason.restartRequired) {
						print.info('RESTARTING PAIRING...');
						process.exit();
					} else {
						print.fail(`PAIR FAILED, REASON UNKNOWN.`);
						process.exit();
					}
				}
			});
		} catch (error) {
			reject(error);
		}
	});
})();
