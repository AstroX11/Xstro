import { fetch, urlBuffer } from '../utils/fetch.mts';
import { Command } from '../messaging/plugin.ts';
import { convertToMp3, toPTT } from '../utils/ffmpeg.mts';
import config from '../../config.mjs';
import { type WAMediaUpload } from 'baileys';

Command({
	name: 'apk',
	fromMe: false,
	isGroup: false,
	desc: 'Download Apk file',
	type: 'download',
	function: async (msg, args) => {
		if (!args) return await msg.send(`_Provide an App name_`);

		await msg.react('⬇️');

		const data = await fetch(`https://bk9.fun/download/apk?id=${args}`).then(
			res =>
				JSON.parse(res).BK9 as {
					name?: string;
					dllink?: string;
					icon?: string;
				},
		);
		if (data.icon) {
			await msg.send(await urlBuffer(data.icon), {
				caption: `_Downloading ${data.name!}_`,
			});
		}
		if (data.name && data.dllink) {
			await msg.react('✅');
			return await msg.client.sendMessage(msg.jid, {
				document: { url: data.dllink },
				caption: data.name,
				fileName: data.name.split(' ')[0],
				mimetype: 'application/vnd.android.package-archive',
			});
		}
	},
});

Command({
	name: 'fb',
	fromMe: false,
	isGroup: false,
	desc: 'Download Facebook Media',
	type: 'download',
	function: async (msg, args) => {
		const url = /^https?:\/\/(www\.|m\.)?facebook\.com(\/|$)/.test(args ?? '');
		if (!url || !args) return await msg.send('_Provide a valid facebook link_');

		await msg.react('⬇️');

		const data = await fetch(
			`https://bk9.fun/download/fb?url=${new URL(args)}`,
		).then(res => JSON.parse(res).BK9 as { sd: string; hd: string });

		const { sd, hd } = data;
		if (hd) {
			await msg.send(await urlBuffer(hd));
			return await msg.react('✅');
		} else {
			await msg.send(await urlBuffer(sd));
			return await msg.react('✅');
		}
	},
});

Command({
	name: 'insta',
	fromMe: false,
	isGroup: false,
	desc: 'Download Instagram Media',
	type: 'download',
	function: async (msg, args) => {
		const url = /^https?:\/\/(www\.|m\.)?instagram\.com(\/|$)/.test(args ?? '');
		if (!url || !args)
			return await msg.send('_Provide a valid instagram link_');

		const data = await fetch(
			`https://bk9.fun/download/instagram?url=${new URL(args)}`,
		).then(res => JSON.parse(res).BK9 as { type: string; url: string }[]);

		const media = data.map(urls => urls.url);

		for (const content of media) {
			await msg.send(await urlBuffer(content));
		}
		return await msg.react('✅');
	},
});

Command({
	name: 'twitter',
	fromMe: false,
	isGroup: false,
	desc: 'Download Twitter Media',
	type: 'download',
	function: async (msg, args) => {
		const url = /^https?:\/\/(www\.|m\.)?twitter\.com(\/|$)/.test(args ?? '');
		if (!url || !args) return await msg.send('_Provide a valid twitter link_');

		await msg.react('⬇️');

		const data = await fetch(
			`https://bk9.fun/download/twitter?url=${new URL(args)}`,
		).then(res => JSON.parse(res).BK9 as { HD: string; caption: string });

		const { HD, caption } = data;

		await msg.send(await urlBuffer(HD), { caption: `${caption ?? ''}`.trim() });
		return await msg.react('✅');
	},
});
Command({
	name: 'dmp3',
	fromMe: false,
	isGroup: false,
	desc: 'Download Any Mp3 Media via Link.',
	type: 'download',
	function: async (msg, args) => {
		if (!args) {
			msg.send(
				'_Provide any MP3 URL. Note: This works only for direct audio file links, not social media or streaming sites._',
			);
			return;
		}

		await msg.react('⬇️');

		try {
			const url = new URL(args);
			await msg.client.sendMessage(msg.jid, {
				audio: { url },
				ptt: false,
				mimetype: 'audio/mpeg',
			});
		} catch {
			msg.send('_Invalid URL provided. Please check your input._');
		}
	},
});

Command({
	name: 'dmp4',
	fromMe: false,
	isGroup: false,
	desc: 'Download Any Mp4 Media via Link.',
	type: 'download',
	function: async (msg, args) => {
		if (!args) {
			msg.send(
				'_Provide any mp4 URL. Note: This works only for direct video file links, not social media or YouTube._',
			);
			return;
		}

		await msg.react('⬇️');

		try {
			const url = new URL(args);
			await msg.client.sendMessage(msg.jid, {
				video: { url },
				caption: 'Here is your MP4 file.',
			});
		} catch {
			msg.send('_Invalid URL provided. Please check your input._');
		}
	},
});

Command({
	name: 'tiktok',
	fromMe: false,
	isGroup: false,
	desc: 'Download Tiktok Media',
	type: 'download',
	function: async (msg, args) => {
		const url = /^https?:\/\/(www\.|m\.)?tiktok\.com(\/|$)/.test(args ?? '');
		if (!url || !args) return await msg.send('_Provide a valid tiktok link_');

		await msg.react('⬇️');

		const data = await fetch(
			`https://bk9.fun/download/tiktok?url=${new URL(args)}`,
		).then(
			res => JSON.parse(res).BK9 as { BK9: string; desc: string | undefined },
		);

		const { BK9: media, desc } = data;

		await msg.send(await urlBuffer(media), { caption: `${desc ?? ''}`.trim() });
		return await msg.react('✅');
	},
});

Command({
	name: 'yts',
	fromMe: false,
	isGroup: false,
	desc: 'Search and download Youtube Media',
	type: 'download',
	function: async (msg, args) => {},
});

Command({
	name: 'ytv',
	fromMe: false,
	isGroup: false,
	desc: 'Download Youtube Video Media',
	type: 'download',
	function: async (msg, args) => {},
});

Command({
	name: 'yta',
	fromMe: false,
	isGroup: false,
	desc: 'Download Youtube Audio Media',
	type: 'download',
	function: async (msg, args) => {
		const url = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)(\/|$)/.test(
			args ?? '',
		);
		if (!url || !args) return await msg.send('_Provide a valid youtube link_');

		await msg.react('⬇️');

		const data = await fetch(
			`https://bk9.fun/download/ytmp3?url=${new URL(args)}&type=mp3`,
		).then(
			res =>
				JSON.parse(res).BK9 as {
					image?: string;
					title?: string;
					downloadUrl?: string;
				},
		);
		const { image, title, downloadUrl } = data;

		const audio: WAMediaUpload = await convertToMp3(
			await urlBuffer(downloadUrl!),
		);

		await msg.client.sendMessage(msg.jid, {
			audio: audio,
			ptt: false,
			mimetype: 'audio/mpeg',
			contextInfo: {
				externalAdReply: {
					title: title,
					body: config.BOT_NAME ?? 'χѕтяσ',
					mediaType: 1,
					thumbnailUrl: image,
				},
			},
		});
		return await msg.react('✅');
	},
});

Command({
	name: 'reddit',
	fromMe: false,
	isGroup: false,
	desc: 'Download Reddit Media',
	type: 'download',
	function: async (msg, args) => {},
});

Command({
	name: 'rumble',
	fromMe: false,
	isGroup: false,
	desc: 'Download Rumble Media',
	type: 'download',
	function: async (msg, args) => {},
});
