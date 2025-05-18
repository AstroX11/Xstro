import { Command } from '../messaging/plugin.ts';
import { getAlive } from '../models/alive.ts';

Command({
	name: 'alive',
	fromMe: false,
	isGroup: false,
	desc: 'Get Alive message',
	type: 'misc',
	function: async (msg, match) => {
		if (!match) {
			const m = await getAlive(msg);
			if (!m) {
				return await msg.send(
					`\`\`\`${msg.pushName} I am alive and running\`\`\``,
				);
			} else {
				return await msg.send(m);
			}
		}
	},
});
