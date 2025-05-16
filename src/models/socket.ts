import { DataType } from 'quantava';
import database from './_db.ts';
import type { BaileysEventMap } from 'baileys';

const Calls = database.define('calls', {
	chatId: { type: DataType.STRING, allowNull: true },
	from: { type: DataType.STRING, allowNull: true },
	isGroup: { type: DataType.BOOLEAN, allowNull: true },
	groupJid: { type: DataType.STRING, allowNull: true },
	id: { type: DataType.STRING, allowNull: true },
	date: { type: DataType.STRING, allowNull: true },
	isVideo: { type: DataType.BOOLEAN, allowNull: true },
	status: { type: DataType.STRING, allowNull: true },
	offline: { type: DataType.BOOLEAN, allowNull: true },
	latencyMs: { type: DataType.INTEGER, allowNull: true },
});

/** Save call events to the database */
export async function saveCalls(update: BaileysEventMap['call']) {
	for (const call of update) {
		console.log(`Is Group:`, call?.isGroup);
		console.log(`Group  Jid:`, call?.groupJid);
		console.log(`Is offline ?:`, call?.offline);
		console.log(`Is it a video call:`, call?.isVideo);
		await Calls.create({
			chatId: call.chatId,
			from: call.from,
			isGroup: call.isGroup ?? null,
			groupJid: call.groupJid ?? null,
			id: call.id,
			date: call.date.toISOString(),
			isVideo: call.isVideo ?? null,
			status: call.status,
			offline: call.offline,
			latencyMs: call.latencyMs ?? null,
		});
	}
}
