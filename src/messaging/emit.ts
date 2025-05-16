import { saveCalls } from '../models/socket.ts';
import ConnectionUpdate from './Class/Emit/Connection.ts';
import MessageUpsert from './Class/Emit/MessageUpsert.ts';
import type { WASocket } from 'baileys';

export default function (
	clientSocket: WASocket,
	{ saveCreds }: { saveCreds: () => Promise<void> },
) {
	clientSocket.ev.process(async events => {
		if (events['creds.update']) {
			await saveCreds();
		}

		if (events['connection.update']) {
			new ConnectionUpdate(clientSocket, events['connection.update']);
		}

		if (events.call) {
			await saveCalls(events.call);
		}

		if (events['messages.upsert']) {
			new MessageUpsert(clientSocket, events['messages.upsert']);
		}
	});
}
